const cursor = document.querySelector(".personal-cursor");
const returnCursor = document.querySelector(".return-cursor");
const returnCursorComment = document.querySelector(".return-cursor-comment");
const returnCursorLabel = document.querySelector(".return-cursor-label");
const returnCursorPrompt = document.querySelector(".return-cursor-prompt");
const topMenu = document.querySelector(".top-menu");
const topMenuToggle = document.querySelector(".top-menu-toggle");
const pageHeading = document.querySelector(".page-heading");
const finePointer = window.matchMedia("(pointer: fine)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const LONG_PRESS_EDIT_DELAY_MS = 420;
const creatorMessageTiers = [
  [
    "Oops, let me put that back.",
    "I liked it a little better here.",
    "Just fixing my tiny detail.",
    "That spot felt right to me.",
    "Let's keep it this way.",
    "Putting that back gently.",
    "I think it lives here.",
    "Just a little designer instinct.",
    "I saved its favorite spot.",
    "That one feels happier here.",
    "Let me keep this tidy.",
    "I had a soft reason for that.",
    "Back to its cozy corner.",
    "This placement still wins for me.",
    "I promise it looks calmer here.",
    "Just helping it settle back in.",
    "That one belongs right here.",
    "A tiny reset from me.",
    "I'm keeping this one in place.",
    "There, much better again.",
  ],
  [
    "You move it, I moisturize the layout.",
    "That was a plot twist. I fixed it.",
    "Tiny chaos detected. Carry on.",
    "I gave it a better seat again.",
    "This pixel has union protection.",
    "Let me quietly undo that adventure.",
    "We tried something. We learned.",
    "That move had confidence. Not accuracy.",
    "I respect the curiosity. I reject the result.",
    "This is now a supervised interaction.",
    "A brave choice. A reversible one.",
    "You nudged it. I spiritually disagreed.",
    "The layout flinched, so I helped.",
    "That was experimental. This is intentional.",
    "I heard the spacing gasp.",
    "You explored. I restored.",
    "I’m keeping the drama low and the alignment high.",
    "That was cute. I corrected it.",
    "The composition filed a complaint.",
    "I brought the pixel back to its family.",
  ],
  [
    "At this point we're co-designing, and I'm winning.",
    "You keep moving it like it pays rent.",
    "This layout and I are in a committed relationship.",
    "I love your energy. The answer is still no.",
    "We're really exploring every wrong option together.",
    "I admire the persistence. So does the undo spirit.",
    "If this keeps up, I'm adding security.",
    "We have now entered playful sabotage territory.",
    "I moved it back with extra conviction this time.",
    "You test the limits. I test the snap-back.",
    "This is less drag and more character development.",
    "The layout knows what you did.",
    "I can do this all day, politely.",
    "You move it. I parent it.",
    "At this rate, the pixel will start recognizing you.",
    "We’re building a beautiful trust issue.",
    "You really said 'what if chaos,' huh.",
    "I’m not upset. I’m just returning it again.",
    "The spacing gods remain unconvinced.",
    "I appreciate the commitment to being incorrect.",
  ],
];
const creatorEditComments = [
  "I saw the rewrite. I kept the original cut.",
  "Cute edit. I’m keeping my line.",
  "We tried new copy. I missed the old one.",
  "That sentence had a little adventure. It’s home now.",
  "You wrote a version. I wrote it back.",
  "Tiny copy rebellion detected.",
  "That line and I have history.",
  "I gave the words their old seats back.",
  "Nice remix. I restored the original track.",
  "I’m letting the first draft win this one.",
  "The copy wandered off. I brought it back.",
  "I read your edit. I chose peace.",
  "That line was doing just fine before.",
  "I put the sentence back on its best behavior.",
  "We visited a new version. I drove us back.",
  "That copy change had confidence.",
  "The wording got experimental. I got involved.",
  "I returned the sentence to factory settings.",
  "That line knows where it belongs.",
  "I let the original wording have its moment again.",
];
const idlePrompts = [
  "Try moving it.",
  "Go on, drag it.",
  "You can move this.",
  "Give it a little nudge.",
  "Try touching the layout.",
];
const FIRST_IDLE_PROMPT_DELAY_MS = 5000;
const RECURRING_IDLE_PROMPT_DELAY_MS = 30000;
const draggableItems = [...document.querySelectorAll(".draggable-item")];
const repairableTitles = [...document.querySelectorAll(".repairable-title")];
let totalMoveCount = 0;

if (cursor) {
  const moveCursor = (event) => {
    if (event.pointerType === "touch") {
      cursor.style.opacity = "0";
      return;
    }

    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    cursor.style.opacity = "1";
  };

  const hideCursor = () => {
    cursor.style.opacity = "0";
  };

  const showCursor = (event) => {
    if (event.pointerType === "touch") {
      hideCursor();
      return;
    }

    moveCursor(event);
  };

  cursor.style.opacity = "0";
  window.addEventListener("pointermove", moveCursor, { passive: true });
  window.addEventListener("pointerenter", showCursor, { passive: true });
  window.addEventListener("pointerleave", hideCursor, { passive: true });
}

const stage = document.querySelector(".hero-nameplate");
const dragGuideLine = document.querySelector(".drag-guide-line");
const dragGuideLabel = document.querySelector(".drag-guide-label");
const dragGuideText = document.querySelector(".drag-guide-text");
const isMenuBlockingBot = () => coarsePointer && document.body.classList.contains("menu-open");
const blankSelectionBox = document.createElement("div");
blankSelectionBox.className = "blank-selection-box";
blankSelectionBox.innerHTML = `
  <span class="interactive-corner interactive-corner-top-left" aria-hidden="true"></span>
  <span class="interactive-corner interactive-corner-top-right" aria-hidden="true"></span>
  <span class="interactive-corner interactive-corner-bottom-left" aria-hidden="true"></span>
  <span class="interactive-corner interactive-corner-bottom-right" aria-hidden="true"></span>
`;
document.body.append(blankSelectionBox);
let blankSelectionHideTimeout = 0;

const isBlankCanvasTarget = (target) =>
  target === document.body ||
  target === document.documentElement ||
  target.closest(".hero-nameplate") === stage ||
  target.classList?.contains("page-shell");

const showBlankSelectionBox = (x, y) => {
  const boxSize = 50;
  const left = Math.min(Math.max(x - boxSize / 2, 0), window.innerWidth - boxSize);
  const top = Math.min(Math.max(y - boxSize / 2, 0), window.innerHeight - boxSize);

  window.clearTimeout(blankSelectionHideTimeout);
  blankSelectionBox.style.transition = "none";
  blankSelectionBox.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`;
  blankSelectionBox.style.opacity = "1";
  void blankSelectionBox.offsetWidth;
  blankSelectionBox.style.transition = "opacity 220ms ease, transform 220ms ease";
  blankSelectionHideTimeout = window.setTimeout(() => {
    blankSelectionBox.style.opacity = "0";
    blankSelectionBox.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1.18)`;
    window.setTimeout(() => {
      if (blankSelectionBox.style.opacity === "0") {
        blankSelectionBox.style.transform = "translate3d(-9999px, -9999px, 0) scale(1)";
      }
    }, 220);
  }, 420);
};

const hideBlankSelectionBox = () => {
  window.clearTimeout(blankSelectionHideTimeout);
  blankSelectionBox.style.opacity = "0";
  blankSelectionBox.style.transform = "translate3d(-9999px, -9999px, 0) scale(1)";
};

const setSharedDragGuide = (x1, y1, x2, y2) => {
  if (!dragGuideLine) {
    return;
  }

  dragGuideLine.setAttribute("x1", x1);
  dragGuideLine.setAttribute("y1", y1);
  dragGuideLine.setAttribute("x2", x2);
  dragGuideLine.setAttribute("y2", y2);
  dragGuideLine.style.opacity = "1";

  if (dragGuideLabel && dragGuideText) {
    const deltaX = Math.round(x2 - x1);
    const deltaY = Math.round(y2 - y1);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    dragGuideText.textContent = `dx: ${deltaX},  dy: ${deltaY}`;
    dragGuideLabel.style.transform = `translate3d(${midX}px, ${midY}px, 0) translate(-50%, -50%)`;
    dragGuideLabel.style.opacity = "1";
  }
};

const clearSharedDragGuide = () => {
  if (!dragGuideLine) {
    return;
  }

  dragGuideLine.style.opacity = "0";

  if (dragGuideLabel) {
    dragGuideLabel.style.opacity = "0";
    dragGuideLabel.style.transform = "translate3d(-9999px, -9999px, 0)";
  }
};

const projectLocks = [...document.querySelectorAll(".project-lock[data-project-lock]")];
const unlockedProjectLocks = new Set();
const initProjectLocks = () => {
  if (!projectLocks.length) {
    return;
  }

  const encoder = new TextEncoder();
  const encryptedProjectContentById = {
    "habuild-tv": {
      salt: "r//dTjz6GtH6vYZueCLqHg==",
      iv: "3uRepRqEJC9d0efr",
      ciphertext:
        "nTC3pj5mcBJrclvPcs+1GW+/vAOs3+nqel5o1dyBq6U3zj9RLuGfUbXl8urmI8Fi/X06OF6hxBpEY8j0+qd3DEiZ49FT1RPCcaUW7VsjWDRT8pxN4f+/28CtxA6zxo6DamG36ryWvDfiuMTZf1Ic4zwMZ+VR1cCULlMa8OitkAqOT623USaJwXnM0NC/DPI+jgiZhw1BYifrtB1kuGeBQXfFjkuO83Oh9n0T0g+9TBlj4c5WZMiP5Vtj5OPtfnh7LUQ7ClLCL8/9WlM+cNc2wHDVrkNKwjIeKLBplDsBdJ4oP2LoYUVjTOATKkXvdqaoxouieNpHt8iUOpIekkkHV8mXSAYHdcdIm3nrQHPOAnOt8jNlJVqDgc+GjGPQml06MZ7DcFSmm3KyVeC8wu8SWTwlEfbu4KNAWxhmUsdjslqcj5ZXopAic3VV3JR1Ah1qR0i6ExbxDb3qdPwB/zZo8lXvWi4/Hs6kg3vYkyDmqw9pleiSZUPS450uogT1fCTTiRFu9J/OfmaVimCvahp4VdNfCEF0eLq9vnBBXj8eSUPCSmsZTCzriKgVzBicyb4JMTBzKjtKzsqbnAqeG5flsZy6wxGvvWCXFHdIrY8SSFD5F72fXvNxvZylaXcGcJinFMA/T1Tmdjyv2m7DfmIOI5fBACa0W0Z/FVr4rL2oW92tcTE4YurGik5MnAbnPpecfWl10hCmvE/DfOropojlLK0DRrtCx2TjvAO+fSQVj4lRY9Lx4EDUlM7mvGUuyf6aVWuHranlCw/Ku8jfL0Oln6l5aOU/CFfre5dQXSMPyx7Pwcy+d5t94WHG5kiv32ZgIU43AFfE09YcbA7MUZoQ2HEmQDKExcnU7khjPra5fCgbpNeNovOeRwbHMR2lqNnPG0xbchI9cWcQR+FCIZ6NQj7FG1L/EwWN1D0N+7MgwmZHLfMDn1u6oZsFazUsz7aSQ8FyKX8j+yIBilzoOZ3mw6hgJep80lQC2fyCVc4DJWTAahXSuvdEEH0G9KAkNLPZzRsiX+V1i/xoAhEJ07AMQbfBnLZzXRbY8V6eX6Ol7COSNqPK8Ij2YuhJV+I9JamuEVA8qS5sEwWtDoshC6+QgKFUQzxA4ehVmki1minhVQenY1JuhVfyZRh6P6DCdRFbkIVqkoQ2oW4dhCwUDLbK/ZRH/oiBkkgKh44bSS42FGWRDxc4HAccImmlj9b0TL29l9heTN2JUqeULzl2ec6/jrI4Q6Dft/969A9hSL2TeyuR1tPja/d9IclyHIj5/Gv34YWnZM+sp6nfE8osWs79t6DqJNEt9MMCMSBh5hoeZu2m2my+nQTm0t/OWqoGEiITEGbfvPWEDPD+ftBkdIwFs/Id4+c/fmbsfEOuzzy0e7sOrPO/qPSq+OGyWLsD8yMhZsuSuXzhhBE/AiWve+RZrhWtXYvslv2TJfUcE5nppeqTb62rvkx+7Lu3/DQTc1glt708omi0zOkRjgGU4yUuVZFZqfh2bJin/U6Buznoe9KwwS3j1c6MkM/mGGsqtUoHYglTRhqUPzehgkKFXQCi8Kd5rnZsvh+zUxFcdwigs7c5cm0RgCK6YX8MJiH8hVJgsopYVp1OGk/sYzb4Gww8wiT7AFBa4aFrm9qGRCq47NHmhS2sWYpUsTPksL2brQtII0yvMJ1mgWw/V+v9I5GTO7ZNgfskrIJ1Ru56c0XRws+Uq2eS0HsRhsq5kZsQPLZPvqVXg3Aw6pgCntKnkwb6J92r9DGHiKFv84oOgno2OjZCis16U1BUabVsDnCQkkOUPfzX4c3nhE+XU9Q9Fn4b0zvKeDQvc9dW2fjo1hB+dI+Mxo0aK6DDwyh9QdAtN58z3kIk6jqnJaHeAOFBcRX2IN1CYFKcDE9ypryArP/61jpDgbX3mrDpjLjSZqo8pMUZhAyL/POrzzbilka2JcAkkhwLpx9oVrcX2ygppnGClKBaLRqGGpAewEM69hbtT3l+FAeSgWw8UuehYs/6veTiuo2czoIxT2P0ORygxfiHRe5RkaJy+KQECDYRTXFOI/jJGteJXLfpplMhjhc+DdU/SyuGQqbeQPkdeILcsiHf1OjnWhcJPTa4HxlQ0yxuLzGL20tsmj/qQm2iFRfY5slWSMRTLwWJClAoiHyYQJ0zZiZLucR+Rt2vJNwSRy05vuQZvjN0JudbcXz/L4EYsGIuTH55McKPBUt8GBHGHEJRwKzqAjJty4t8o6caH5JZbBR0TWqUEfr0Zp8IXvfb7CGuA+otedscFzODNnXhXs3box/OP/HuvtPqI45X3BOg2M2V/EOW8v+kMTLREFHg/j4AbvfxGR00GCsrnN0kFGqQsZ7Wrh/bmIaMUokhUpRW1154ukyaozeC/4ONqz8tlwTgIEyiDRYZrodcnfuN8L9e9+T2heIdvFs2u0tlTLtxF9/GAR6uMRD2+/ZPSuuPYeR1MQY6HfSBIFFhVfTvcqC2XXRJSBvezAZJcLqMCITbgkpgtNiongqjI9GTzXiIPpgDcQo+viaq8k0TQFbrIGsnoHX/8+czazSw7ixNOmYDEtAyF2rOtct7FhPN6b5SzTcT/g5t88MzCD13a4RDoByU45uNIGoJ7CQbejMQZqdTzsWJKfZZW77obJzsTLHIADGrjeT9gAuISksMHRoEu/M5stZaSVVncpLPTL1UDpKLgVCdfbUyVc+Z9sLxVgMJfXX99JjdMvVEubHxl59acxjvaHwqQs2KBkqK6zz9Bo5r1EMJuoYKvryAHxCb0M4P9+0XF4xualvQDiXtArK83Rq2LCdltFZHTHxHwwb6beJZLA79RD5UfyPCg3DUhOumHmBy/3TOYgfIGEdL/PnAPC4HHvs2vVC5lYQto42rQkFrsLXKOhX9rj/6BWGsqAcSUNuJD67mxnUhk6Yr7gBghc2ZOhqaA1LxwoUzV8K8BzsCNRLzfW2Z5ySEL+GcnrwkFmnc0rNIPnqPPw0WZ73v9H2k7fI9x+fxv20RtG8YUY6IdbSjU451c2irGjQf16RLwK45DzI4lLt/nRgYlo6HlVyr6p2wgVTIeIpCrBPTBRbsuji1va1kZn45rIgck4z9Q7YidGKSTMHkCQR7vxarQQ+o8N9b+Y11cZ2Hbu7tgVS3fdCGicYyalNfL4t6UMc7LMAydwN9uGGVJW4eiiGM+EegDvlatVHR/0mUK6zWltcqV3Opt3FJTeVxgiIVazckVtcCUo9S1amys2mVMenzreS1XUXgl1JYC64+lm23jQrWrIgLh0MjwOWZd8BvDnJZz5wr7Gx05C8u3oewFtT5YWK4xr1YvKoNDqZzmKSJrVS82yciKNSNmXBED4rN1zT8weaL1zYVSv6kfAGqWV37BP9bFdFeg02uDuim4SMFROaQ1yJ3wc+s6nHDC5dVNxXCWIENzJ3jt6gGXI3106sLAtFzCdWsfaCdSaJlb15aVnrCMJJ4LKJSdmtGHTvbwjTrbNJSTNSFnz5X7KdVZ0bp85nnw1ZEwipbzeu2d4JxC3kE1yPY0TgLyyxLhSoDxd+ufrKjZ7n5Q3qh6YrmfBH2/IjMfMi2BpSWFHVLZXKgQil+AsTinWPVNsigymlZbYOPU12a+ZFTJMNDC5iAuN7wGcEhvpgTkAj3mFiWLz1yn5xmAVpV3YeKz9bh8b+Oj7zHFNc05OipK9NycrygZhlNHTQJEsL1z2DomRiKr702QEHx8L+ppdQRBvOuFP4e2D8VnlTynb/QsCftd4VvMHHXUOA9Ft2zKzyOG4CMlgmlrcQunyZ4RkQ26UaiYKX2GnwCAJ1VXjiwKBdZanxI4H34ZGaNmxzoaunFRhZZ/q/EN5iVGqU+AFSebHF1t/sxYSi8RQOVYqK64DMOniBesuzrItIBLjzIS/lM51X5K7u626mCODlWLoX6lB+420twp9cBc7xGb6eXMSkXTDg=",
      tag: "1jLqqX7F0b7bOHIba4EBxg==",
    },
  };

  const base64ToBytes = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

  const deriveProjectKey = async (password, saltBytes) => {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 120000,
        hash: "SHA-256",
      },
      keyMaterial,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );
  };

  const decryptProjectHtml = async (password, payload) => {
    const saltBytes = base64ToBytes(payload.salt);
    const ivBytes = base64ToBytes(payload.iv);
    const cipherBytes = base64ToBytes(payload.ciphertext);
    const tagBytes = base64ToBytes(payload.tag);
    const encryptedBytes = new Uint8Array(cipherBytes.length + tagBytes.length);

    encryptedBytes.set(cipherBytes, 0);
    encryptedBytes.set(tagBytes, cipherBytes.length);

    const key = await deriveProjectKey(password, saltBytes);
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      key,
      encryptedBytes
    );

    return new TextDecoder().decode(decrypted);
  };

  projectLocks.forEach((lockNode) => {
    const lockId = lockNode.dataset.projectLock;
    const encryptedPayload = encryptedProjectContentById[lockId];
    const mount = lockNode.querySelector(".project-lock-mount");
    const form = lockNode.querySelector(".project-lock-form");
    const input = lockNode.querySelector(".project-lock-input");
    const error = lockNode.querySelector(".project-lock-error");
    const visibilityToggle = lockNode.querySelector(".project-lock-visibility");

    if (!encryptedPayload || !mount || !form || !input || !error) {
      return;
    }

    const unlock = () => {
      lockNode.classList.remove("is-locked");
      unlockedProjectLocks.add(lockId);
      error.textContent = "";
      input.value = "";
    };

    if (unlockedProjectLocks.has(lockId)) {
      unlock();
      return;
    }

    visibilityToggle?.addEventListener("click", () => {
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      visibilityToggle.setAttribute("aria-pressed", String(!isVisible));
      visibilityToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";

      if (!window.crypto?.subtle) {
        error.textContent = "This browser can't verify the password right now.";
        return;
      }

      const value = input.value.trim();
      if (!value) {
        error.textContent = "Enter the password to unlock this project.";
        return;
      }

      try {
        const html = await decryptProjectHtml(value, encryptedPayload);
        mount.innerHTML = html;
        unlock();
        return;
      } catch (unlockError) {
        error.textContent = "That password didn’t match.";
      }
    });
  });
};

initProjectLocks();

if (topMenu && topMenuToggle) {
  const updateMobileTogglePinning = () => {
    if (!coarsePointer || window.innerWidth > 640 || !pageHeading) {
      topMenuToggle.style.top = "";
      topMenuToggle.style.transform = "";
      return;
    }

    if (document.body.classList.contains("menu-open")) {
      topMenuToggle.style.top = "";
      topMenuToggle.style.transform = "";
      return;
    }

    const threshold = 32;
    const headingTop = pageHeading.getBoundingClientRect().top;
    const offsetY = Math.min(0, headingTop - threshold);
    topMenuToggle.style.top = "";
    topMenuToggle.style.transform = `translate3d(0, ${offsetY}px, 0)`;
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    topMenuToggle.setAttribute("aria-expanded", "false");
    updateMobileTogglePinning();
  };

  topMenuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = document.body.classList.toggle("menu-open");
    topMenuToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen && returnCursor) {
      returnCursor.style.opacity = "0";
      returnCursor.style.transform = "translate3d(-9999px, -9999px, 0)";
    }
    updateMobileTogglePinning();
  });

  topMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("pointerdown", (event) => {
    if (
      document.body.classList.contains("menu-open") &&
      !event.target.closest(".top-menu") &&
      !event.target.closest(".top-menu-toggle")
    ) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (!coarsePointer || window.innerWidth > 640) {
      closeMenu();
    }
    updateMobileTogglePinning();
  });

  window.addEventListener("scroll", updateMobileTogglePinning, { passive: true });
  window.addEventListener("load", updateMobileTogglePinning);
  updateMobileTogglePinning();
}

if (stage && draggableItems.length) {
  const getNodeTextElement = (node) => node.querySelector(".editable-text");
  const defaultTextMap = new Map(
    draggableItems.map((item) => [item, (getNodeTextElement(item)?.textContent || "").trim()])
  );
  const taglineNode = draggableItems.find(
    (item) => item.dataset.draggableName === "tagline"
  );
  const idleNudgeCandidates = draggableItems.filter(
    (item) => item.dataset.draggableName !== "tagline"
  );
  const taglineDefaultText = defaultTextMap.get(taglineNode) || "";
  let selectedName = null;
  let hasPositionedNames = false;
  let hasUserMovedName = false;
  let idleTimerId = 0;
  let idleDelayMs = FIRST_IDLE_PROMPT_DELAY_MS;
  let isIdlePromptRunning = false;
  let returnCursorVisible = false;
  let returnCursorPosition = { x: -9999, y: -9999 };
  const originMap = new Map();
  const pendingReturnTimeouts = new WeakMap();
  const returnQueue = [];
  let activeReturn = null;
  let activeTextEdit = null;
  let idleTaglineEditState = null;

  const selectName = (node) => {
    draggableItems.forEach((item) => item.classList.toggle("is-selected", item === node));
    selectedName = node;
  };

  const clearSelection = () => {
    draggableItems.forEach((item) => item.classList.remove("is-selected"));
    selectedName = null;
  };

  const getNodeDisplayText = (node) => {
    const textNode = getNodeTextElement(node);
    return (textNode?.textContent || "").trim();
  };

  const setNodeDisplayText = (node, text, showCaret = false) => {
    const textNode = getNodeTextElement(node);
    if (!textNode) {
      return;
    }

    textNode.textContent = text;
    node.classList.toggle("is-caret-visible", showCaret);
  };

  const recenterNodeToPoint = (node, centerX, centerY) => {
    const rect = node.getBoundingClientRect();
    node.style.left = `${centerX - rect.width / 2}px`;
    node.style.top = `${centerY - rect.height / 2}px`;
  };

  const centerNames = () => {
    const firstName = draggableItems.find(
      (item) => item.dataset.draggableName === "kaustubh"
    );
    const secondName = draggableItems.find(
      (item) => item.dataset.draggableName === "mokashi"
    );
    const roleLayer = draggableItems.find(
      (item) => item.dataset.draggableName === "product-creator"
    );
    const captionLayer = draggableItems.find(
      (item) => item.dataset.draggableName === "tagline"
    );

    if (!firstName || !secondName || !roleLayer || !captionLayer) {
      return;
    }

    const captionOffset = Math.max(14, Math.min(24, window.innerWidth * 0.02));
    const stageWidth = window.innerWidth;
    const stageHeight = window.innerHeight;
    const firstRect = firstName.getBoundingClientRect();
    const secondRect = secondName.getBoundingClientRect();
    const roleRect = roleLayer.getBoundingClientRect();
    const captionRect = captionLayer.getBoundingClientRect();
    const groupHeight = firstRect.height + secondRect.height;
    const top = (stageHeight - groupHeight) / 2;
    const firstLeft = (stageWidth - firstRect.width) / 2;
    const secondLeft = (stageWidth - secondRect.width) / 2;
    const secondTop = top + firstRect.height;

    firstName.style.left = `${firstLeft}px`;
    firstName.style.top = `${top}px`;
    secondName.style.left = `${secondLeft}px`;
    secondName.style.top = `${secondTop}px`;
    roleLayer.style.left = `${firstLeft + firstRect.width / 2 - roleRect.width / 2}px`;
    roleLayer.style.top = `${top - 43 - roleRect.height}px`;
    captionLayer.style.left = `${secondLeft + secondRect.width / 2 - captionRect.width / 2}px`;
    captionLayer.style.top = `${secondTop + secondRect.height + captionOffset}px`;
    originMap.set(firstName, {
      left: firstLeft,
      top,
      centerX: firstLeft + firstRect.width / 2,
      centerY: top + firstRect.height / 2,
    });
    originMap.set(secondName, {
      left: secondLeft,
      top: secondTop,
      centerX: secondLeft + secondRect.width / 2,
      centerY: secondTop + secondRect.height / 2,
    });
    originMap.set(roleLayer, {
      left: firstLeft + firstRect.width / 2 - roleRect.width / 2,
      top: top - 43 - roleRect.height,
      centerX: firstLeft + firstRect.width / 2,
      centerY: top - 43 - roleRect.height / 2,
    });
    originMap.set(captionLayer, {
      left: secondLeft + secondRect.width / 2 - captionRect.width / 2,
      top: secondTop + secondRect.height + captionOffset,
      centerX: secondLeft + secondRect.width / 2,
      centerY: secondTop + secondRect.height + captionOffset + captionRect.height / 2,
    });
  };

  const positionReturnCursor = (x, y) => {
    if (!returnCursor) {
      return;
    }

    returnCursorVisible = true;
    returnCursorPosition = { x, y };
    returnCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    returnCursor.style.opacity = "1";
  };

  const hideReturnCursor = () => {
    if (!returnCursor) {
      return;
    }

    returnCursor.classList.remove("is-prompting");
    returnCursor.classList.remove("is-commenting");
    if (returnCursorComment) {
      returnCursorComment.textContent = returnCursorComment.dataset.fullComment || "";
    }
    if (returnCursorPrompt) {
      returnCursorPrompt.textContent = idlePrompts[0];
    }
    if (returnCursorLabel) {
      returnCursorLabel.style.opacity = "1";
    }
    returnCursorVisible = false;
    returnCursorPosition = { x: -9999, y: -9999 };
    returnCursor.style.opacity = "0";
    returnCursor.style.transform = "translate3d(-9999px, -9999px, 0)";
  };

  const clearHelperTimeouts = (helperState) => {
    if (!helperState || !helperState.timeouts) {
      return;
    }

    helperState.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    helperState.timeouts = [];

    if (helperState.cleanup) {
      helperState.cleanup();
      helperState.cleanup = null;
    }
  };

  const clearBotState = (node) => {
    node.classList.remove("is-bot-hover", "is-bot-pressing");
  };

  const clearTextEditState = (node) => {
    node.classList.remove("is-text-editing", "is-caret-visible");
    const textNode = getNodeTextElement(node);
    if (!textNode) {
      return;
    }

    textNode.removeAttribute("contenteditable");
    textNode.removeAttribute("spellcheck");
    textNode.blur();
  };

  const getElementPosition = (node) => {
    const rect = node.getBoundingClientRect();
    const left = Number.parseFloat(node.style.left);
    const top = Number.parseFloat(node.style.top);

    return {
      left: Number.isFinite(left) ? left : rect.left,
      top: Number.isFinite(top) ? top : rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const restoreNodeToDefaultState = (node) => {
    const defaultText = defaultTextMap.get(node);
    const origin = originMap.get(node);

    clearBotState(node);
    clearTextEditState(node);

    if (typeof defaultText === "string") {
      setNodeDisplayText(node, defaultText);
    }

    if (origin) {
      node.style.left = `${origin.left}px`;
      node.style.top = `${origin.top}px`;
    }
  };

  const ensureAllNodesAtDefaultState = () => {
    draggableItems.forEach((node) => {
      const pendingTimeout = pendingReturnTimeouts.get(node);
      const isQueued = returnQueue.some((item) => item.node === node);
      const isActiveNode = activeReturn?.node === node;

      if (pendingTimeout || isQueued || isActiveNode) {
        return;
      }

      restoreNodeToDefaultState(node);
    });
  };

  const removeQueuedReturn = (node, reason = null) => {
    for (let index = returnQueue.length - 1; index >= 0; index -= 1) {
      const item = returnQueue[index];

      if (item.node !== node) {
        continue;
      }

      if (reason && item.reason !== reason) {
        continue;
      }

      returnQueue.splice(index, 1);
    }
  };

  const cancelReturnForNode = (node, { preserveMove = false } = {}) => {
    const pendingTimeout = pendingReturnTimeouts.get(node);

    if (pendingTimeout) {
      if (!(preserveMove && pendingTimeout.reason === "move")) {
        clearTimeout(pendingTimeout.id);
        pendingReturnTimeouts.delete(node);
      }
    }

    removeQueuedReturn(node, preserveMove ? "text" : null);
    clearBotState(node);

    if (activeReturn && activeReturn.node === node) {
      cancelAnimationFrame(activeReturn.frameId);
      clearHelperTimeouts(activeReturn);
      activeReturn = null;
      clearSharedDragGuide();
      hideReturnCursor();
    }
  };

  const getRandomEdgePoint = (targetX, targetY) => {
    const sides = ["left", "right", "top", "bottom"];
    const side = sides[Math.floor(Math.random() * sides.length)];

    switch (side) {
      case "left":
        return { x: -32, y: targetY };
      case "right":
        return { x: window.innerWidth + 32, y: targetY };
      case "top":
        return { x: targetX, y: -32 };
      default:
        return { x: targetX, y: window.innerHeight + 32 };
    }
  };

  const getCurveControlPoint = (startPoint, endPoint, bendScale = 0.22) => {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;
    const normalX = -deltaY / distance;
    const normalY = deltaX / distance;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const bend = Math.max(36, distance * bendScale) * direction;

    return {
      x: midX + normalX * bend,
      y: midY + normalY * bend,
    };
  };

  const getQuadraticPoint = (startPoint, controlPoint, endPoint, progress) => {
    const inverse = 1 - progress;

    return {
      x:
        inverse * inverse * startPoint.x +
        2 * inverse * progress * controlPoint.x +
        progress * progress * endPoint.x,
      y:
        inverse * inverse * startPoint.y +
        2 * inverse * progress * controlPoint.y +
        progress * progress * endPoint.y,
    };
  };

  const animateReturnCursorTo = (endPoint, duration, onComplete) => {
    if (!returnCursorVisible) {
      onComplete?.();
      return;
    }

    const startPoint = { x: returnCursorPosition.x, y: returnCursorPosition.y };
    const controlPoint = getCurveControlPoint(startPoint, endPoint, 0.14);
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const nextPoint = getQuadraticPoint(startPoint, controlPoint, endPoint, eased);

      positionReturnCursor(nextPoint.x, nextPoint.y);

      if (progress < 1) {
        if (activeReturn) {
          activeReturn.frameId = requestAnimationFrame(tick);
        }
        return;
      }

      onComplete?.();
    };

    if (activeReturn) {
      activeReturn.frameId = requestAnimationFrame(tick);
    }
  };

  const setTaglineDisplay = (text, showCaret = false) => {
    if (!taglineNode) {
      return;
    }

    setNodeDisplayText(taglineNode, text, showCaret);

    if (idleTaglineEditState) {
      taglineNode.style.minHeight = `${idleTaglineEditState.minHeight}px`;
      taglineNode.style.minWidth = `${idleTaglineEditState.minWidth}px`;
      recenterNodeToPoint(
        taglineNode,
        idleTaglineEditState.centerX,
        idleTaglineEditState.centerY
      );
    }
  };

  const resetTaglineDisplay = () => {
    if (taglineNode) {
      clearTextEditState(taglineNode);
      taglineNode.style.minHeight = "";
      taglineNode.style.minWidth = "";
    }

    idleTaglineEditState = null;
    setTaglineDisplay(taglineDefaultText);
  };

  const getCreatorMessage = () => {
    const tierIndex =
      totalMoveCount <= 1 ? 0 : totalMoveCount <= 3 ? 1 : 2;
    const messages = creatorMessageTiers[tierIndex];

    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getCreatorEditComment = () =>
    creatorEditComments[Math.floor(Math.random() * creatorEditComments.length)];

  const getSharedPrefixLength = (currentText, defaultText) => {
    const maxLength = Math.min(currentText.length, defaultText.length);
    let prefixLength = 0;

    while (
      prefixLength < maxLength &&
      currentText[prefixLength].toLowerCase() === defaultText[prefixLength].toLowerCase()
    ) {
      prefixLength += 1;
    }

    return prefixLength;
  };

  const queueReturn = (node, reason) => {
    removeQueuedReturn(node, reason);
    returnQueue.push({ node, reason });
    processReturnQueue();
  };

  const finalizeTextEdit = (node, { revert = false } = {}) => {
    if (!activeTextEdit || activeTextEdit.node !== node) {
      return;
    }

    const { originalText, defaultText, centerX, centerY } = activeTextEdit;
    if (revert) {
      setNodeDisplayText(node, originalText);
    } else {
      setNodeDisplayText(node, getNodeDisplayText(node));
    }

    recenterNodeToPoint(node, centerX, centerY);

    clearTextEditState(node);
    activeTextEdit = null;
    hasUserMovedName = true;
    scheduleIdlePrompt();

    if (revert || getNodeDisplayText(node) === defaultText) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pendingReturnTimeouts.delete(node);
      queueReturn(node, "text");
    }, 1000);

    pendingReturnTimeouts.set(node, { id: timeoutId, reason: "text" });
  };

  const beginTextEdit = (node) => {
    const textNode = getNodeTextElement(node);
    if (!textNode) {
      return;
    }

    if (activeTextEdit && activeTextEdit.node !== node) {
      finalizeTextEdit(activeTextEdit.node);
    }

    const rect = node.getBoundingClientRect();
    cancelReturnForNode(node, { preserveMove: true });
    selectName(node);
    node.classList.add("is-text-editing");
    textNode.setAttribute("contenteditable", "true");
    textNode.setAttribute("spellcheck", "false");
    textNode.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textNode);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);

    activeTextEdit = {
      node,
      originalText: getNodeDisplayText(node),
      defaultText: defaultTextMap.get(node) || "",
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    };
  };

  const scheduleIdlePrompt = () => {
    window.clearTimeout(idleTimerId);

    if (activeReturn || isIdlePromptRunning || isMenuBlockingBot()) {
      return;
    }

    idleTimerId = window.setTimeout(() => {
      if (activeReturn || isIdlePromptRunning || isMenuBlockingBot()) {
        return;
      }

      const targetPool = idleNudgeCandidates.length ? idleNudgeCandidates : draggableItems;
      const targetNode = targetPool[Math.floor(Math.random() * targetPool.length)];
      const targetPosition = getElementPosition(targetNode);
      const targetCenter = {
        x: targetPosition.left + targetPosition.width / 2,
        y: targetPosition.top + targetPosition.height / 2,
      };
      const startPoint = getRandomEdgePoint(targetCenter.x, targetCenter.y);
      const endPoint = {
        x: targetCenter.x + 10,
        y: targetCenter.y + 6,
      };
      const controlPoint = getCurveControlPoint(startPoint, endPoint, 0.18);
      const idleState = {
        node: targetNode,
        frameId: 0,
        timeouts: [],
        cleanup: null,
      };

      isIdlePromptRunning = true;
      activeReturn = idleState;
      positionReturnCursor(startPoint.x, startPoint.y);

      const approachStart = performance.now();
      const approachDuration = 900;

      const animateApproach = (now) => {
        const progress = Math.min((now - approachStart) / approachDuration, 1);
        const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress);
        const nextPoint = getQuadraticPoint(startPoint, controlPoint, endPoint, eased);

        positionReturnCursor(nextPoint.x, nextPoint.y);

        if (progress < 1) {
          idleState.frameId = requestAnimationFrame(animateApproach);
          return;
        }

        selectName(targetNode);
        targetNode.classList.add("is-bot-hover");
        returnCursor.classList.add("is-prompting");
        const idlePrompt =
          idlePrompts[Math.floor(Math.random() * idlePrompts.length)];

        if (returnCursorPrompt) {
          returnCursorPrompt.textContent = "";
        }

        const promptTimeout = window.setTimeout(() => {
          if (!activeReturn || activeReturn.node !== targetNode) {
            return;
          }

          const fullPrompt = idlePrompt;
          let charIndex = 0;

          const typeNextPromptCharacter = () => {
            if (!activeReturn || activeReturn.node !== targetNode || !returnCursorPrompt) {
              return;
            }

            charIndex += 1;
            returnCursorPrompt.textContent = fullPrompt.slice(0, charIndex);

            if (charIndex < fullPrompt.length) {
              const typingTimeout = window.setTimeout(typeNextPromptCharacter, 45);
              idleState.timeouts.push(typingTimeout);
              return;
            }

            targetNode.classList.remove("is-bot-hover");
            targetNode.classList.add("is-bot-pressing");

            const currentLeft = Number.parseFloat(targetNode.style.left) || targetPosition.left;
            const currentTop = Number.parseFloat(targetNode.style.top) || targetPosition.top;
            const nudgeLeft = currentLeft + Math.min(8, window.innerWidth * 0.012);
            const nudgeTop = currentTop - Math.min(4, window.innerHeight * 0.008);
            const nudgeCenter = {
              x: nudgeLeft + targetPosition.width / 2,
              y: nudgeTop + targetPosition.height / 2,
            };

            setDragGuide(targetCenter.x, targetCenter.y, nudgeCenter.x, nudgeCenter.y);

            const nudgeStart = performance.now();
            const nudgeDuration = 320;
            const nudgeControl = getCurveControlPoint(targetCenter, nudgeCenter, 0.1);

            const animateNudgeOut = (nudgeNow) => {
              const nudgeProgress = Math.min((nudgeNow - nudgeStart) / nudgeDuration, 1);
              const easedNudge = 1 - (1 - nudgeProgress) * (1 - nudgeProgress);
              const nextPoint = getQuadraticPoint(
                targetCenter,
                nudgeControl,
                nudgeCenter,
                easedNudge
              );

              targetNode.style.left = `${nextPoint.x - targetPosition.width / 2}px`;
              targetNode.style.top = `${nextPoint.y - targetPosition.height / 2}px`;
              positionReturnCursor(nextPoint.x, nextPoint.y);
              setDragGuide(targetCenter.x, targetCenter.y, nextPoint.x, nextPoint.y);

              if (nudgeProgress < 1) {
                idleState.frameId = requestAnimationFrame(animateNudgeOut);
                return;
              }

              const returnStart = performance.now();
              const returnControl = getCurveControlPoint(nudgeCenter, targetCenter, 0.1);

              const animateNudgeBack = (returnNow) => {
                const returnProgress = Math.min((returnNow - returnStart) / nudgeDuration, 1);
                const easedReturn = 1 - (1 - returnProgress) * (1 - returnProgress);
                const nextPoint = getQuadraticPoint(
                  nudgeCenter,
                  returnControl,
                  targetCenter,
                  easedReturn
                );

                targetNode.style.left = `${nextPoint.x - targetPosition.width / 2}px`;
                targetNode.style.top = `${nextPoint.y - targetPosition.height / 2}px`;
                positionReturnCursor(nextPoint.x, nextPoint.y);
                setDragGuide(targetCenter.x, targetCenter.y, nextPoint.x, nextPoint.y);

                if (returnProgress < 1) {
                  idleState.frameId = requestAnimationFrame(animateNudgeBack);
                  return;
                }

                targetNode.style.left = `${currentLeft}px`;
                targetNode.style.top = `${currentTop}px`;
                targetNode.classList.remove("is-bot-pressing");
                returnCursor.classList.remove("is-prompting");
    clearSharedDragGuide();

                const finishIdleExit = (fromPoint) => {
                  const exitPoint = getRandomEdgePoint(fromPoint.x, fromPoint.y);
                  const exitControl = getCurveControlPoint(fromPoint, exitPoint, 0.18);
                  const exitStart = performance.now();
                  const exitDuration = 700;

                  const animateExit = (exitNow) => {
                    const exitProgress = Math.min((exitNow - exitStart) / exitDuration, 1);
                    const easedExit = 1 - (1 - exitProgress) * (1 - exitProgress);
                    const nextPoint = getQuadraticPoint(
                      fromPoint,
                      exitControl,
                      exitPoint,
                      easedExit
                    );

                    positionReturnCursor(nextPoint.x, nextPoint.y);

                    if (exitProgress < 1) {
                      idleState.frameId = requestAnimationFrame(animateExit);
                      return;
                    }

                    if (idleState.cleanup) {
                      idleState.cleanup();
                      idleState.cleanup = null;
                    }

                    activeReturn = null;
                    isIdlePromptRunning = false;
                    hideReturnCursor();
                    if (returnQueue.length > 0) {
                      processReturnQueue();
                      return;
                    }

                    idleDelayMs = RECURRING_IDLE_PROMPT_DELAY_MS;
                    scheduleIdlePrompt();
                  };

                  idleState.frameId = requestAnimationFrame(animateExit);
                };

                if (!taglineNode || !taglineDefaultText) {
                  finishIdleExit(targetCenter);
                  return;
                }

                const taglinePosition = getElementPosition(taglineNode);
                const taglineEditPoint = {
                  x: taglinePosition.left + taglinePosition.width - 10,
                  y: taglinePosition.top + taglinePosition.height / 2,
                };

                idleState.cleanup = () => {
                  resetTaglineDisplay();
                };

                animateReturnCursorTo(taglineEditPoint, 520, () => {
                  if (!activeReturn || activeReturn.node !== targetNode) {
                    return;
                  }

                  const beginTaglineEdit = () => {
                    if (!activeReturn || activeReturn.node !== targetNode) {
                      return;
                    }

                    selectName(taglineNode);
                    taglineNode.classList.add("is-text-editing");
                    idleTaglineEditState = {
                      centerX: taglinePosition.left + taglinePosition.width / 2,
                      centerY: taglinePosition.top + taglinePosition.height / 2,
                      minWidth: taglinePosition.width,
                      minHeight: taglinePosition.height,
                    };
                    taglineNode.style.minHeight = `${idleTaglineEditState.minHeight}px`;
                    taglineNode.style.minWidth = `${idleTaglineEditState.minWidth}px`;
                    let deleteIndex = taglineDefaultText.length;
                    let caretVisible = true;

                    setTaglineDisplay(taglineDefaultText, true);

                    const deleteNextCharacter = () => {
                      if (!activeReturn || activeReturn.node !== targetNode) {
                        return;
                      }

                      deleteIndex -= 1;
                      setTaglineDisplay(taglineDefaultText.slice(0, deleteIndex), true);

                      if (deleteIndex > 0) {
                        const deleteTimeout = window.setTimeout(deleteNextCharacter, 62);
                        idleState.timeouts.push(deleteTimeout);
                        return;
                      }

                      let typeIndex = 0;

                      const typeNextCharacter = () => {
                        if (!activeReturn || activeReturn.node !== targetNode) {
                          return;
                        }

                        typeIndex += 1;
                        setTaglineDisplay(taglineDefaultText.slice(0, typeIndex), true);

                        if (typeIndex < taglineDefaultText.length) {
                          const typeTimeout = window.setTimeout(typeNextCharacter, 96);
                          idleState.timeouts.push(typeTimeout);
                          return;
                        }

                        const blinkInterval = window.setInterval(() => {
                          if (!activeReturn || activeReturn.node !== targetNode) {
                            return;
                          }

                          caretVisible = !caretVisible;
                          setTaglineDisplay(taglineDefaultText, caretVisible);
                        }, 320);

                        idleState.timeouts.push(blinkInterval);

                        const blinkPauseTimeout = window.setTimeout(() => {
                          if (!activeReturn || activeReturn.node !== targetNode) {
                            return;
                          }

                          setTaglineDisplay(taglineDefaultText);
                          finishIdleExit(taglineEditPoint);
                        }, 1200);

                        idleState.timeouts.push(blinkPauseTimeout);
                      };

                      const retypePauseTimeout = window.setTimeout(typeNextCharacter, 380);
                      idleState.timeouts.push(retypePauseTimeout);
                    };

                    const deleteStartPauseTimeout = window.setTimeout(deleteNextCharacter, 320);
                    idleState.timeouts.push(deleteStartPauseTimeout);
                  };

                  taglineNode.classList.add("is-bot-hover");

                  const releaseFirstClick = window.setTimeout(() => {
                    if (!activeReturn || activeReturn.node !== targetNode) {
                      return;
                    }

                    taglineNode.classList.remove("is-bot-pressing");
                  }, 70);

                  const startSecondClick = window.setTimeout(() => {
                    if (!activeReturn || activeReturn.node !== targetNode) {
                      return;
                    }

                    taglineNode.classList.add("is-bot-pressing");
                  }, 130);

                  const finishDoubleClick = window.setTimeout(() => {
                    if (!activeReturn || activeReturn.node !== targetNode) {
                      return;
                    }

                    taglineNode.classList.remove("is-bot-pressing");
                    taglineNode.classList.remove("is-bot-hover");
                    beginTaglineEdit();
                  }, 210);

                  taglineNode.classList.add("is-bot-pressing");
                  idleState.timeouts.push(releaseFirstClick, startSecondClick, finishDoubleClick);
                });
              };

              idleState.frameId = requestAnimationFrame(animateNudgeBack);
            };

            idleState.frameId = requestAnimationFrame(animateNudgeOut);
          };

          typeNextPromptCharacter();
        }, 900);

        idleState.timeouts.push(promptTimeout);
      };

      idleState.frameId = requestAnimationFrame(animateApproach);
    }, idleDelayMs);
  };

  const processReturnQueue = () => {
    if (activeReturn || activeTextEdit || returnQueue.length === 0 || isMenuBlockingBot()) {
      return;
    }

    const { node, reason } = returnQueue.shift();
    const origin = originMap.get(node);

    if (!origin && reason !== "text") {
      processReturnQueue();
      return;
    }

    if (reason === "text") {
      const current = getElementPosition(node);
      const currentText = getNodeDisplayText(node);
      const defaultText = defaultTextMap.get(node) || currentText;

      if (currentText === defaultText) {
        clearTextEditState(node);
        processReturnQueue();
        return;
      }

      const currentCenterX = current.left + current.width / 2;
      const currentCenterY = current.top + current.height / 2;
      const startPoint = returnCursorVisible
        ? { x: returnCursorPosition.x, y: returnCursorPosition.y }
        : getRandomEdgePoint(currentCenterX, currentCenterY);
      const helperState = {
        node,
        frameId: 0,
        timeouts: [],
      };

      activeReturn = helperState;
      positionReturnCursor(startPoint.x, startPoint.y);

      const editPoint = {
        x: current.left + current.width - 10,
        y: current.top + current.height / 2,
      };
      const lockedCenterX = origin?.centerX ?? current.left + current.width / 2;
      const lockedCenterY = origin?.centerY ?? current.top + current.height / 2;

      animateReturnCursorTo(editPoint, 520, () => {
        if (!activeReturn || activeReturn.node !== node) {
          return;
        }

        node.classList.add("is-bot-hover", "is-bot-pressing");

        const releaseFirstClick = window.setTimeout(() => {
          node.classList.remove("is-bot-pressing");
        }, 70);

        const startSecondClick = window.setTimeout(() => {
          if (!activeReturn || activeReturn.node !== node) {
            return;
          }

          node.classList.add("is-bot-pressing");
        }, 130);

        const finishDoubleClick = window.setTimeout(() => {
          if (!activeReturn || activeReturn.node !== node) {
            return;
          }

          clearBotState(node);
          selectName(node);
          node.classList.add("is-text-editing");
          const sharedPrefixLength = getSharedPrefixLength(currentText, defaultText);
          let deleteIndex = currentText.length;

          setNodeDisplayText(node, currentText, true);
          recenterNodeToPoint(node, lockedCenterX, lockedCenterY);

          const deleteNextCharacter = () => {
            if (!activeReturn || activeReturn.node !== node) {
              return;
            }

            deleteIndex -= 1;
            setNodeDisplayText(node, currentText.slice(0, deleteIndex), true);
            recenterNodeToPoint(node, lockedCenterX, lockedCenterY);

            if (deleteIndex > sharedPrefixLength) {
              const deleteTimeout = window.setTimeout(deleteNextCharacter, 55);
              helperState.timeouts.push(deleteTimeout);
              return;
            }

            let typeIndex = sharedPrefixLength;

            const typeNextCharacter = () => {
              if (!activeReturn || activeReturn.node !== node) {
                return;
              }

              typeIndex += 1;
              setNodeDisplayText(node, defaultText.slice(0, typeIndex), true);
              recenterNodeToPoint(node, lockedCenterX, lockedCenterY);

              if (typeIndex < defaultText.length) {
                const typeTimeout = window.setTimeout(typeNextCharacter, 88);
                helperState.timeouts.push(typeTimeout);
                return;
              }

              clearTextEditState(node);
              setNodeDisplayText(node, defaultText);
              recenterNodeToPoint(node, lockedCenterX, lockedCenterY);

              const commentStartTimeout = window.setTimeout(() => {
                if (!activeReturn || activeReturn.node !== node) {
                  return;
                }

                returnCursor.classList.add("is-commenting");
                const fullComment = getCreatorEditComment();
                returnCursorComment.dataset.fullComment = fullComment;
                returnCursorComment.textContent = "";
                let commentIndex = 0;

                const typeComment = () => {
                  if (!activeReturn || activeReturn.node !== node) {
                    return;
                  }

                  commentIndex += 1;
                  returnCursorComment.textContent = fullComment.slice(0, commentIndex);

                  if (commentIndex < fullComment.length) {
                    const commentTimeout = window.setTimeout(typeComment, 28);
                    helperState.timeouts.push(commentTimeout);
                    return;
                  }

                    const holdTimeout = window.setTimeout(() => {
                      if (!activeReturn || activeReturn.node !== node) {
                        return;
                      }

                      returnCursor.classList.remove("is-commenting");
                      ensureAllNodesAtDefaultState();

                      if (returnQueue.length > 0) {
                        activeReturn = null;
                        processReturnQueue();
                        return;
                    }

                    const exitPoint = getRandomEdgePoint(editPoint.x, editPoint.y);
                    const exitStartPoint = {
                      x: returnCursorPosition.x,
                      y: returnCursorPosition.y,
                    };
                    const exitControlPoint = getCurveControlPoint(
                      exitStartPoint,
                      exitPoint,
                      0.2
                    );
                    const exitStart = performance.now();
                    const exitDuration = 560;
                    const exitFallback = window.setTimeout(() => {
                      if (activeReturn === helperState) {
                        activeReturn = null;
                      }
                      hideReturnCursor();
                      processReturnQueue();
                    }, exitDuration + 80);
                    helperState.timeouts.push(exitFallback);

                    const animateExit = (exitNow) => {
                      const exitProgress = Math.min((exitNow - exitStart) / exitDuration, 1);
                      const easedExit = 1 - (1 - exitProgress) * (1 - exitProgress);
                      const nextPoint = getQuadraticPoint(
                        exitStartPoint,
                        exitControlPoint,
                        exitPoint,
                        easedExit
                      );

                      positionReturnCursor(nextPoint.x, nextPoint.y);

                      if (exitProgress < 1) {
                        helperState.frameId = requestAnimationFrame(animateExit);
                        return;
                      }

                      activeReturn = null;
                      clearTimeout(exitFallback);
                      hideReturnCursor();
                      processReturnQueue();
                    };

                    helperState.frameId = requestAnimationFrame(animateExit);
                  }, 2000);

                  helperState.timeouts.push(holdTimeout);
                };

                typeComment();
              }, 500);

              helperState.timeouts.push(commentStartTimeout);
            };

            const typeStartTimeout = window.setTimeout(typeNextCharacter, 280);
            helperState.timeouts.push(typeStartTimeout);
          };

          const deleteStartTimeout = window.setTimeout(deleteNextCharacter, 280);
          helperState.timeouts.push(deleteStartTimeout);
        }, 210);

        helperState.timeouts.push(releaseFirstClick, startSecondClick, finishDoubleClick);
      });

      return;
    }

    const current = getElementPosition(node);
    const deltaLeft = origin.left - current.left;
    const deltaTop = origin.top - current.top;

    if (Math.abs(deltaLeft) < 1 && Math.abs(deltaTop) < 1) {
      node.style.left = `${origin.left}px`;
      node.style.top = `${origin.top}px`;
      hideReturnCursor();
      processReturnQueue();
      return;
    }

    const currentCenterX = current.left + current.width / 2;
    const currentCenterY = current.top + current.height / 2;
    const startPoint = returnCursorVisible
      ? { x: returnCursorPosition.x, y: returnCursorPosition.y }
      : getRandomEdgePoint(currentCenterX, currentCenterY);
    const approachEndPoint = { x: currentCenterX, y: currentCenterY };
    const approachControlPoint = getCurveControlPoint(startPoint, approachEndPoint, 0.2);
    const approachDuration = 420;
    const returnDuration = 720;
    const helperState = {
      node,
      frameId: 0,
      timeouts: [],
    };

    activeReturn = helperState;
    positionReturnCursor(startPoint.x, startPoint.y);

    const approachStart = performance.now();
    const animateApproach = (now) => {
      const progress = Math.min((now - approachStart) / approachDuration, 1);
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress);
      const nextPoint = getQuadraticPoint(
        startPoint,
        approachControlPoint,
        approachEndPoint,
        eased
      );

      positionReturnCursor(nextPoint.x, nextPoint.y);

      if (progress < 1) {
        helperState.frameId = requestAnimationFrame(animateApproach);
        return;
      }

      node.classList.add("is-bot-hover");

      const hoverTimeout = window.setTimeout(() => {
        if (!activeReturn || activeReturn.node !== node) {
          return;
        }

        node.classList.remove("is-bot-hover");
        node.classList.add("is-bot-pressing");

        const pressTimeout = window.setTimeout(() => {
          if (!activeReturn || activeReturn.node !== node) {
            return;
          }

          const returnStart = performance.now();
          const startCenterX = current.left + current.width / 2;
          const startCenterY = current.top + current.height / 2;
          const returnStartPoint = { x: startCenterX, y: startCenterY };
          const returnEndPoint = {
            x: origin.left + current.width / 2,
            y: origin.top + current.height / 2,
          };
          const returnControlPoint = getCurveControlPoint(
            returnStartPoint,
            returnEndPoint,
            0.16
          );

          const animateReturn = (returnNow) => {
            const returnProgress = Math.min((returnNow - returnStart) / returnDuration, 1);
            const easedReturn = 1 - (1 - returnProgress) * (1 - returnProgress);
            const nextPoint = getQuadraticPoint(
              returnStartPoint,
              returnControlPoint,
              returnEndPoint,
              easedReturn
            );
            const nextLeft = nextPoint.x - current.width / 2;
            const nextTop = nextPoint.y - current.height / 2;

            node.style.left = `${nextLeft}px`;
            node.style.top = `${nextTop}px`;
            positionReturnCursor(nextPoint.x, nextPoint.y);
            setDragGuide(
              startCenterX,
              startCenterY,
              nextPoint.x,
              nextPoint.y
            );

            if (returnProgress < 1) {
              helperState.frameId = requestAnimationFrame(animateReturn);
              return;
            }

            node.style.left = `${origin.left}px`;
            node.style.top = `${origin.top}px`;
            selectName(node);
            clearDragGuide();

            const finalCenterX = origin.left + current.width / 2;
            const finalCenterY = origin.top + current.height / 2;
            positionReturnCursor(finalCenterX, finalCenterY);

            const commentStartTimeout = window.setTimeout(() => {
              if (!activeReturn || activeReturn.node !== node) {
                return;
              }

              clearBotState(node);
              returnCursor.classList.add("is-commenting");
              const fullComment = getCreatorMessage();

              const startTypingSequence = () => {
                if (!activeReturn || activeReturn.node !== node || !returnCursorComment) {
                  return;
                }

                returnCursorComment.textContent = "...";

                const indicatorTimeout = window.setTimeout(() => {
                  if (!activeReturn || activeReturn.node !== node || !returnCursorComment) {
                    return;
                  }

                  returnCursorComment.textContent = "";
                  let charIndex = 0;

                  const typeNextCharacter = () => {
                    if (!activeReturn || activeReturn.node !== node || !returnCursorComment) {
                      return;
                    }

                    charIndex += 1;
                    returnCursorComment.textContent = fullComment.slice(0, charIndex);

                    if (charIndex < fullComment.length) {
                      const typingTimeout = window.setTimeout(typeNextCharacter, 40);
                      helperState.timeouts.push(typingTimeout);
                      return;
                    }

                    const holdTimeout = window.setTimeout(() => {
                      if (!activeReturn || activeReturn.node !== node) {
                        return;
                      }

                      returnCursor.classList.remove("is-commenting");
                      if (returnCursorComment) {
                        returnCursorComment.textContent = fullComment;
                      }
                      ensureAllNodesAtDefaultState();
                      activeReturn = null;

                      if (returnQueue.length > 0) {
                        processReturnQueue();
                        return;
                      }

                      const exitPoint = getRandomEdgePoint(finalCenterX, finalCenterY);
                      const exitStartPoint = { x: returnCursorPosition.x, y: returnCursorPosition.y };
                      const exitControlPoint = getCurveControlPoint(
                        exitStartPoint,
                        exitPoint,
                        0.2
                      );
                      const exitStart = performance.now();
                      const exitDuration = 420;
                      const exitFallback = window.setTimeout(() => {
                        hideReturnCursor();
                        processReturnQueue();
                      }, exitDuration + 80);
                      helperState.timeouts.push(exitFallback);

                      const animateExit = (exitNow) => {
                        const exitProgress = Math.min((exitNow - exitStart) / exitDuration, 1);
                        const easedExit = 1 - (1 - exitProgress) * (1 - exitProgress);
                        const nextPoint = getQuadraticPoint(
                          exitStartPoint,
                          exitControlPoint,
                          exitPoint,
                          easedExit
                        );

                        positionReturnCursor(nextPoint.x, nextPoint.y);

                        if (exitProgress < 1) {
                          helperState.frameId = requestAnimationFrame(animateExit);
                          return;
                        }

                        clearTimeout(exitFallback);
                        hideReturnCursor();
                        processReturnQueue();
                      };

                      helperState.frameId = requestAnimationFrame(animateExit);
                    }, 2000);

                    helperState.timeouts.push(holdTimeout);
                  };

                  typeNextCharacter();
                }, 420);

                helperState.timeouts.push(indicatorTimeout);
              };

              if (returnCursorComment && returnCursorLabel) {
                returnCursorComment.dataset.fullComment = fullComment;
                returnCursorLabel.style.opacity = "0";
                returnCursorComment.textContent = fullComment;

                requestAnimationFrame(() => {
                  if (!activeReturn || activeReturn.node !== node || !returnCursorLabel) {
                    return;
                  }

                  const labelRect = returnCursorLabel.getBoundingClientRect();
                  const viewportCenterX = window.innerWidth / 2;
                  const labelCenterX = labelRect.left + labelRect.width / 2;
                  const wouldOverflow =
                    labelRect.left < 16 || labelRect.right > window.innerWidth - 16;

                  if (!wouldOverflow) {
                    returnCursorLabel.style.opacity = "1";
                    startTypingSequence();
                    return;
                  }

                  const targetX = returnCursorPosition.x + (viewportCenterX - labelCenterX);
                  animateReturnCursorTo(
                    { x: targetX, y: returnCursorPosition.y },
                    260,
                    () => {
                      if (returnCursorLabel) {
                        returnCursorLabel.style.opacity = "1";
                      }
                      startTypingSequence();
                    }
                  );
                });
              } else {
                startTypingSequence();
              }
            }, 1000);

            helperState.timeouts.push(commentStartTimeout);
          };

          helperState.frameId = requestAnimationFrame(animateReturn);
        }, 140);

        helperState.timeouts.push(pressTimeout);
      }, 160);

      helperState.timeouts.push(hoverTimeout);
    };

    helperState.frameId = requestAnimationFrame(animateApproach);
  };

  const setDragGuide = (x1, y1, x2, y2) => {
    if (!dragGuideLine) {
      return;
    }

    dragGuideLine.setAttribute("x1", x1);
    dragGuideLine.setAttribute("y1", y1);
    dragGuideLine.setAttribute("x2", x2);
    dragGuideLine.setAttribute("y2", y2);
    dragGuideLine.style.opacity = "1";

    if (dragGuideLabel && dragGuideText) {
      const deltaX = Math.round(x2 - x1);
      const deltaY = Math.round(y2 - y1);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      dragGuideText.textContent = `dx: ${deltaX},  dy: ${deltaY}`;
      dragGuideLabel.style.transform = `translate3d(${midX}px, ${midY}px, 0) translate(-50%, -50%)`;
      dragGuideLabel.style.opacity = "1";
    }
  };

  const clearDragGuide = () => {
    if (!dragGuideLine) {
      return;
    }

    dragGuideLine.style.opacity = "0";

    if (dragGuideLabel) {
      dragGuideLabel.style.opacity = "0";
      dragGuideLabel.style.transform = "translate3d(-9999px, -9999px, 0)";
    }
  };

  const positionNames = () => {
    if (hasPositionedNames) {
      return;
    }

    centerNames();
    hasPositionedNames = true;
  };

  positionNames();
  selectName(
    draggableItems.find((item) => item.dataset.draggableName === "kaustubh") ||
      draggableItems[0]
  );
  window.addEventListener("load", centerNames);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      centerNames();
      selectName(
        draggableItems.find((item) => item.dataset.draggableName === "kaustubh") ||
          draggableItems[0]
      );
    });
  }

  draggableItems.forEach((node) => {
    const textNode = getNodeTextElement(node);

    textNode?.addEventListener("blur", () => {
      if (activeTextEdit?.node === node) {
        finalizeTextEdit(node);
      }
    });

    textNode?.addEventListener("input", () => {
      if (activeTextEdit?.node !== node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      node.style.left = `${activeTextEdit.centerX - rect.width / 2}px`;
      node.style.top = `${activeTextEdit.centerY - rect.height / 2}px`;
    });

    textNode?.addEventListener("keydown", (event) => {
      if (activeTextEdit?.node !== node) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        finalizeTextEdit(node);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        finalizeTextEdit(node, { revert: true });
      }
    });

    node.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      idleDelayMs = FIRST_IDLE_PROMPT_DELAY_MS;
      beginTextEdit(node);
    });

    node.addEventListener("pointerdown", (event) => {
      if (activeTextEdit?.node === node) {
        return;
      }

      if (activeTextEdit && activeTextEdit.node !== node) {
        finalizeTextEdit(activeTextEdit.node);
      }

      event.stopPropagation();
      idleDelayMs = FIRST_IDLE_PROMPT_DELAY_MS;
      selectName(node);

      if (activeReturn && activeReturn.node === node) {
        cancelAnimationFrame(activeReturn.frameId);
        clearHelperTimeouts(activeReturn);
        clearBotState(activeReturn.node);
        clearDragGuide();
        activeReturn = null;
        isIdlePromptRunning = false;
        hideReturnCursor();
      }

      cancelReturnForNode(node);
      scheduleIdlePrompt();

      const rect = node.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const pointerId = event.pointerId;
      const startCenterX = rect.left + rect.width / 2;
      const startCenterY = rect.top + rect.height / 2;
      const startClientX = event.clientX;
      const startClientY = event.clientY;
      let didMoveElement = false;
      let dragStarted = false;
      let longPressTriggered = false;
      let longPressTimeoutId = 0;

      const startDrag = () => {
        if (dragStarted || longPressTriggered) {
          return;
        }

        dragStarted = true;
        node.classList.add("is-dragging");
        node.setPointerCapture(pointerId);
      };

      if (coarsePointer) {
        longPressTimeoutId = window.setTimeout(() => {
          longPressTriggered = true;
          beginTextEdit(node);
        }, LONG_PRESS_EDIT_DELAY_MS);
      } else {
        startDrag();
      }

      const moveName = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return;
        }

        if (longPressTriggered) {
          return;
        }

        const deltaX = moveEvent.clientX - startClientX;
        const deltaY = moveEvent.clientY - startClientY;
        const travelDistance = Math.hypot(deltaX, deltaY);

        if (!dragStarted) {
          if (coarsePointer && travelDistance < 8) {
            return;
          }

          if (longPressTimeoutId) {
            clearTimeout(longPressTimeoutId);
            longPressTimeoutId = 0;
          }

          startDrag();
        }

        hasUserMovedName = true;
        didMoveElement = true;

        const nextLeft = Math.min(
          Math.max(moveEvent.clientX - offsetX, 0),
          window.innerWidth - rect.width
        );
        const nextTop = Math.min(
          Math.max(moveEvent.clientY - offsetY, 0),
          window.innerHeight - rect.height
        );

        node.style.left = `${nextLeft}px`;
        node.style.top = `${nextTop}px`;
        setDragGuide(
          startCenterX,
          startCenterY,
          nextLeft + rect.width / 2,
          nextTop + rect.height / 2
        );
      };

      const releaseName = (upEvent) => {
        if (upEvent.pointerId !== pointerId) {
          return;
        }

        if (longPressTimeoutId) {
          clearTimeout(longPressTimeoutId);
          longPressTimeoutId = 0;
        }

        if (longPressTriggered) {
          window.removeEventListener("pointermove", moveName);
          window.removeEventListener("pointerup", releaseName);
          window.removeEventListener("pointercancel", releaseName);
          return;
        }

        if (!dragStarted) {
          window.removeEventListener("pointermove", moveName);
          window.removeEventListener("pointerup", releaseName);
          window.removeEventListener("pointercancel", releaseName);
          return;
        }

        node.classList.remove("is-dragging");
        node.releasePointerCapture(pointerId);

        if (didMoveElement) {
          clearSelection();
        }

        clearDragGuide();
        window.removeEventListener("pointermove", moveName);
        window.removeEventListener("pointerup", releaseName);
        window.removeEventListener("pointercancel", releaseName);

        const origin = originMap.get(node);
        const currentLeft = Number.parseFloat(node.style.left) || rect.left;
        const currentTop = Number.parseFloat(node.style.top) || rect.top;

        if (!origin) {
          return;
        }

        const deltaLeft = origin.left - currentLeft;
        const deltaTop = origin.top - currentTop;

        if (Math.abs(deltaLeft) < 1 && Math.abs(deltaTop) < 1) {
          hideReturnCursor();
          return;
        }

        totalMoveCount += 1;

        const timeoutId = window.setTimeout(() => {
          pendingReturnTimeouts.delete(node);
          removeQueuedReturn(node);
          queueReturn(node, "move");
        }, 1000);

        pendingReturnTimeouts.set(node, { id: timeoutId, reason: "move" });
        scheduleIdlePrompt();
      };

      window.addEventListener("pointermove", moveName);
      window.addEventListener("pointerup", releaseName);
      window.addEventListener("pointercancel", releaseName);
    });
  });

  window.addEventListener("resize", () => {
    if (!hasUserMovedName) {
      centerNames();
    }

    idleDelayMs = FIRST_IDLE_PROMPT_DELAY_MS;
    scheduleIdlePrompt();
  });

  document.addEventListener("pointerdown", (event) => {
    if (activeTextEdit && !event.target.closest(".draggable-item")) {
      finalizeTextEdit(activeTextEdit.node);
    }

    if (isBlankCanvasTarget(event.target)) {
      showBlankSelectionBox(event.clientX, event.clientY);
    } else {
      hideBlankSelectionBox();
    }

    if (!event.target.closest(".draggable-item")) {
      clearSelection();
    }

    idleDelayMs = FIRST_IDLE_PROMPT_DELAY_MS;
    scheduleIdlePrompt();
  });

  window.addEventListener("pointermove", () => {
    idleDelayMs = FIRST_IDLE_PROMPT_DELAY_MS;
    scheduleIdlePrompt();
  }, { passive: true });

  scheduleIdlePrompt();
}

if (repairableTitles.length) {
  const repairableTextMap = new Map(
    repairableTitles.map((node) => [
      node,
      node.querySelector(".repairable-text-content")?.textContent?.trim() || "",
    ])
  );
  const pendingRepairTimeouts = new WeakMap();
  const repairQueue = [];
  const repairOffsets = new WeakMap(repairableTitles.map((node) => [node, { x: 0, y: 0 }]));
  const repairMoveSnapshots = new WeakMap();
  const repairOriginMap = new WeakMap();
  let activeRepair = null;
  let activeRepairEdit = null;
  let selectedRepairable = null;
  let repairCursorVisible = false;
  let repairCursorPosition = { x: -9999, y: -9999 };

  const getRepairableTextNode = (node) => node.querySelector(".repairable-text-content");
  const getRepairableText = (node) => (getRepairableTextNode(node)?.textContent || "").trim();
  const getRepairableOffset = (node) => repairOffsets.get(node) || { x: 0, y: 0 };

  const setRepairableOffset = (node, x, y) => {
    repairOffsets.set(node, { x, y });
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const recenterRepairableToPoint = (node, centerX, centerY) => {
    const rect = node.getBoundingClientRect();
    const currentOffset = getRepairableOffset(node);
    const currentCenterX = rect.left + rect.width / 2;
    const currentCenterY = rect.top + rect.height / 2;

    setRepairableOffset(
      node,
      currentOffset.x + (centerX - currentCenterX),
      currentOffset.y + (centerY - currentCenterY)
    );
  };

  const alignRepairableToLeftTop = (node, left, top) => {
    const rect = node.getBoundingClientRect();
    const currentOffset = getRepairableOffset(node);

    setRepairableOffset(
      node,
      currentOffset.x + (left - rect.left),
      currentOffset.y + (top - rect.top)
    );
  };

  const updateRepairableOrigins = () => {
    repairableTitles.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const currentOffset = getRepairableOffset(node);
      repairOriginMap.set(node, {
        left: rect.left - currentOffset.x,
        top: rect.top - currentOffset.y,
        centerX: rect.left + rect.width / 2 - currentOffset.x,
        centerY: rect.top + rect.height / 2 - currentOffset.y,
      });
    });
  };

  const setRepairableText = (node, text, showCaret = false) => {
    const textNode = getRepairableTextNode(node);
    if (!textNode) {
      return;
    }

    textNode.textContent = text;
    node.classList.toggle("is-caret-visible", showCaret);
  };

  const clearRepairableEditState = (node) => {
    node.classList.remove("is-text-editing", "is-caret-visible");
    const textNode = getRepairableTextNode(node);
    if (!textNode) {
      return;
    }

    textNode.removeAttribute("contenteditable");
    textNode.removeAttribute("spellcheck");
    textNode.blur();
  };

  const selectRepairable = (node) => {
    repairableTitles.forEach((item) => item.classList.toggle("is-selected", item === node));
    selectedRepairable = node;
  };

  const clearRepairableSelection = () => {
    repairableTitles.forEach((item) => item.classList.remove("is-selected"));
    selectedRepairable = null;
  };

  const positionRepairCursor = (x, y) => {
    if (!returnCursor) {
      return;
    }

    repairCursorVisible = true;
    repairCursorPosition = { x, y };
    returnCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    returnCursor.style.opacity = "1";
  };

  const hideRepairCursor = () => {
    if (!returnCursor) {
      return;
    }

    returnCursor.classList.remove("is-commenting");
    returnCursor.classList.remove("is-prompting");
    if (returnCursorComment) {
      returnCursorComment.textContent = returnCursorComment.dataset.fullComment || "";
    }
    if (returnCursorPrompt) {
      returnCursorPrompt.textContent = idlePrompts[0];
    }
    if (returnCursorLabel) {
      returnCursorLabel.style.opacity = "1";
    }
    repairCursorVisible = false;
    repairCursorPosition = { x: -9999, y: -9999 };
    returnCursor.style.opacity = "0";
    returnCursor.style.transform = "translate3d(-9999px, -9999px, 0)";
  };

  const clearRepairHelperTimeouts = (helperState) => {
    if (!helperState?.timeouts) {
      return;
    }

    helperState.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    helperState.timeouts = [];
  };

  const clearRepairBotState = (node) => {
    node.classList.remove("is-bot-hover", "is-bot-pressing");
  };

  const restoreRepairableToDefaultState = (node) => {
    clearRepairBotState(node);
    clearRepairableEditState(node);
    setRepairableText(node, repairableTextMap.get(node) || getRepairableText(node));
    node.style.minWidth = "";
    node.style.minHeight = "";
    setRepairableOffset(node, 0, 0);
  };

  const ensureAllRepairablesAtDefaultState = () => {
    repairableTitles.forEach((node) => {
      const pendingTimeout = pendingRepairTimeouts.get(node);
      const isQueued = repairQueue.some((item) => item.node === node);
      const isActiveNode = activeRepair?.node === node || activeRepairEdit?.node === node;

      if (pendingTimeout || isQueued || isActiveNode) {
        return;
      }

      restoreRepairableToDefaultState(node);
    });
  };

  const getRandomEdgePoint = (targetX, targetY) => {
    const sides = ["left", "right", "top", "bottom"];
    const side = sides[Math.floor(Math.random() * sides.length)];

    switch (side) {
      case "left":
        return { x: -32, y: targetY };
      case "right":
        return { x: window.innerWidth + 32, y: targetY };
      case "top":
        return { x: targetX, y: -32 };
      default:
        return { x: targetX, y: window.innerHeight + 32 };
    }
  };

  const getCurveControlPoint = (startPoint, endPoint, bendScale = 0.2) => {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;
    const normalX = -deltaY / distance;
    const normalY = deltaX / distance;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const bend = Math.max(36, distance * bendScale) * direction;

    return {
      x: midX + normalX * bend,
      y: midY + normalY * bend,
    };
  };

  const getQuadraticPoint = (startPoint, controlPoint, endPoint, progress) => {
    const inverse = 1 - progress;

    return {
      x:
        inverse * inverse * startPoint.x +
        2 * inverse * progress * controlPoint.x +
        progress * progress * endPoint.x,
      y:
        inverse * inverse * startPoint.y +
        2 * inverse * progress * controlPoint.y +
        progress * progress * endPoint.y,
    };
  };

  const removeQueuedRepair = (node, reason = null) => {
    for (let index = repairQueue.length - 1; index >= 0; index -= 1) {
      const item = repairQueue[index];
      if (item.node !== node) {
        continue;
      }

      if (reason && item.reason !== reason) {
        continue;
      }

      repairQueue.splice(index, 1);
    }
  };

  const queueRepair = (node, reason) => {
    removeQueuedRepair(node, reason);
    repairQueue.push({ node, reason });
    processRepairQueue();
  };

  const pruneRepairQueue = () => {
    for (let index = repairQueue.length - 1; index >= 0; index -= 1) {
      const item = repairQueue[index];
      const node = item.node;
      const currentText = getRepairableText(node);
      const defaultText = repairableTextMap.get(node) || currentText;
      const currentOffset = getRepairableOffset(node);
      const textMatches = currentText === defaultText;
      const positionMatches = Math.abs(currentOffset.x) < 1 && Math.abs(currentOffset.y) < 1;

      if (item.reason === "text" && textMatches) {
        repairQueue.splice(index, 1);
        continue;
      }

      if (item.reason === "move" && positionMatches) {
        repairQueue.splice(index, 1);
      }
    }
  };

  const cancelRepairForNode = (node, { preserveMove = false } = {}) => {
    const pendingTimeout = pendingRepairTimeouts.get(node);
    if (pendingTimeout) {
      if (!(preserveMove && pendingTimeout.reason === "move")) {
        clearTimeout(pendingTimeout.id);
        pendingRepairTimeouts.delete(node);
      }
    }

    removeQueuedRepair(node, preserveMove ? "text" : null);

    if (activeRepair && activeRepair.node === node) {
      cancelAnimationFrame(activeRepair.frameId);
      clearRepairHelperTimeouts(activeRepair);
      clearRepairBotState(node);
      clearDragGuide();
      activeRepair = null;
      hideRepairCursor();
    }
  };

  const animateRepairCursorTo = (endPoint, duration, onComplete) => {
    if (!repairCursorVisible) {
      onComplete?.();
      return;
    }

    const startPoint = { x: repairCursorPosition.x, y: repairCursorPosition.y };
    const controlPoint = getCurveControlPoint(startPoint, endPoint, 0.14);
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const nextPoint = getQuadraticPoint(startPoint, controlPoint, endPoint, eased);

      positionRepairCursor(nextPoint.x, nextPoint.y);

      if (progress < 1) {
        if (activeRepair) {
          activeRepair.frameId = requestAnimationFrame(tick);
        }
        return;
      }

      onComplete?.();
    };

    if (activeRepair) {
      activeRepair.frameId = requestAnimationFrame(tick);
    }
  };

  const exitRepairCursor = (helperState, exitPoint, duration = 520) => {
    const exitStartPoint = { x: repairCursorPosition.x, y: repairCursorPosition.y };
    const exitControl = getCurveControlPoint(exitStartPoint, exitPoint, 0.2);
    const exitStart = performance.now();
    let finished = false;

    const finishExit = () => {
      if (finished) {
        return;
      }

      finished = true;
      if (activeRepair === helperState) {
        activeRepair = null;
      }
      hideRepairCursor();
      processRepairQueue();
    };

    const fallbackTimeout = window.setTimeout(finishExit, duration + 120);
    helperState.timeouts.push(fallbackTimeout);

    const animateExit = (exitNow) => {
      if (activeRepair && activeRepair !== helperState) {
        finishExit();
        return;
      }

      const exitProgress = Math.min((exitNow - exitStart) / duration, 1);
      const easedExit = 1 - (1 - exitProgress) * (1 - exitProgress);
      const nextPoint = getQuadraticPoint(exitStartPoint, exitControl, exitPoint, easedExit);
      positionRepairCursor(nextPoint.x, nextPoint.y);

      if (exitProgress < 1) {
        helperState.frameId = requestAnimationFrame(animateExit);
        return;
      }

      finishExit();
    };

    helperState.frameId = requestAnimationFrame(animateExit);
  };

  const getRepairCreatorMessage = () => {
    const tierIndex = totalMoveCount <= 1 ? 0 : totalMoveCount <= 3 ? 1 : 2;
    const messages = creatorMessageTiers[tierIndex];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRepairEditComment = () =>
    creatorEditComments[Math.floor(Math.random() * creatorEditComments.length)];

  const resetStaleRepairState = () => {
    if (!activeRepair || repairCursorVisible) {
      return;
    }

    cancelAnimationFrame(activeRepair.frameId);
    clearRepairHelperTimeouts(activeRepair);
    clearRepairBotState(activeRepair.node);
    clearSharedDragGuide();
    activeRepair = null;
    hideRepairCursor();
  };

  const finalizeRepairableEdit = (node, { revert = false } = {}) => {
    if (!activeRepairEdit || activeRepairEdit.node !== node) {
      return;
    }

    const { originalText, defaultText, minWidth, minHeight, left, top } = activeRepairEdit;
    setRepairableText(node, revert ? originalText : getRepairableText(node));
    alignRepairableToLeftTop(node, left, top);
    clearRepairableEditState(node);
    node.style.minWidth = "";
    node.style.minHeight = "";
    activeRepairEdit = null;

    if (revert || getRepairableText(node) === defaultText) {
      return;
    }

    node.style.minWidth = `${minWidth}px`;
    node.style.minHeight = `${minHeight}px`;

    const timeoutId = window.setTimeout(() => {
      pendingRepairTimeouts.delete(node);
      queueRepair(node, "text");
    }, 1000);

    pendingRepairTimeouts.set(node, { id: timeoutId, reason: "text" });
  };

  const beginRepairableEdit = (node) => {
    const textNode = getRepairableTextNode(node);
    if (!textNode) {
      return;
    }

    if (activeRepairEdit && activeRepairEdit.node !== node) {
      finalizeRepairableEdit(activeRepairEdit.node);
    }

    cancelRepairForNode(node, { preserveMove: true });
    selectRepairable(node);
    node.classList.add("is-text-editing");
    textNode.setAttribute("contenteditable", "true");
    textNode.setAttribute("spellcheck", "false");
    textNode.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textNode);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const rect = node.getBoundingClientRect();
    activeRepairEdit = {
      node,
      originalText: getRepairableText(node),
      defaultText: repairableTextMap.get(node) || "",
      left: rect.left,
      top: rect.top,
      minWidth: rect.width,
      minHeight: rect.height,
    };
    node.style.minWidth = `${rect.width}px`;
    node.style.minHeight = `${rect.height}px`;
  };

  const startMoveRepair = (node, { continueFromCurrentCursor = false } = {}) => {
    const rect = node.getBoundingClientRect();
    const moveSnapshot = repairMoveSnapshots.get(node);
    const currentOffset = moveSnapshot?.offset || getRepairableOffset(node);
    const currentCenterX = moveSnapshot?.centerX || rect.left + rect.width / 2;
    const currentCenterY = moveSnapshot?.centerY || rect.top + rect.height / 2;

    if (Math.abs(currentOffset.x) < 1 && Math.abs(currentOffset.y) < 1) {
      repairMoveSnapshots.delete(node);
      setRepairableOffset(node, 0, 0);
      return false;
    }

    const startPoint =
      continueFromCurrentCursor && repairCursorVisible
        ? { x: repairCursorPosition.x, y: repairCursorPosition.y }
        : getRandomEdgePoint(currentCenterX, currentCenterY);
    const approachControl = getCurveControlPoint(
      startPoint,
      { x: currentCenterX, y: currentCenterY },
      0.18
    );
    const helperState = { node, frameId: 0, timeouts: [] };

    activeRepair = helperState;
    positionRepairCursor(startPoint.x, startPoint.y);

    const approachStart = performance.now();
    const animateApproach = (now) => {
      const progress = Math.min((now - approachStart) / 420, 1);
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress);
      const nextPoint = getQuadraticPoint(
        startPoint,
        approachControl,
        { x: currentCenterX, y: currentCenterY },
        eased
      );
      positionRepairCursor(nextPoint.x, nextPoint.y);

      if (progress < 1) {
        helperState.frameId = requestAnimationFrame(animateApproach);
        return;
      }

      node.classList.add("is-bot-hover");

      const hoverTimeout = window.setTimeout(() => {
        if (!activeRepair || activeRepair.node !== node) {
          return;
        }

        node.classList.remove("is-bot-hover");
        node.classList.add("is-bot-pressing");

        const pressTimeout = window.setTimeout(() => {
          if (!activeRepair || activeRepair.node !== node) {
            return;
          }

          const originCenterX = currentCenterX - currentOffset.x;
          const originCenterY = currentCenterY - currentOffset.y;
          const moveStart = performance.now();
          const moveControl = getCurveControlPoint(
            { x: currentCenterX, y: currentCenterY },
            { x: originCenterX, y: originCenterY },
            0.16
          );

          const animateReturn = (moveNow) => {
            const moveProgress = Math.min((moveNow - moveStart) / 720, 1);
            const easedMove = 1 - (1 - moveProgress) * (1 - moveProgress);
            const nextPoint = getQuadraticPoint(
              { x: currentCenterX, y: currentCenterY },
              moveControl,
              { x: originCenterX, y: originCenterY },
              easedMove
            );

            const nextOffsetX = nextPoint.x - originCenterX;
            const nextOffsetY = nextPoint.y - originCenterY;

            setRepairableOffset(node, nextOffsetX, nextOffsetY);
            positionRepairCursor(nextPoint.x, nextPoint.y);
            setSharedDragGuide(currentCenterX, currentCenterY, nextPoint.x, nextPoint.y);

            if (moveProgress < 1) {
              helperState.frameId = requestAnimationFrame(animateReturn);
              return;
            }

            setRepairableOffset(node, 0, 0);
            repairMoveSnapshots.delete(node);
            selectRepairable(node);
            clearSharedDragGuide();
            positionRepairCursor(originCenterX, originCenterY);

            const commentStartTimeout = window.setTimeout(() => {
              if (!activeRepair || activeRepair.node !== node) {
                return;
              }

              node.classList.remove("is-bot-pressing");
              const fullComment = getRepairCreatorMessage();

              const startTypingSequence = () => {
                if (!activeRepair || activeRepair.node !== node || !returnCursorComment) {
                  return;
                }

                returnCursor.classList.add("is-commenting");
                returnCursorComment.dataset.fullComment = fullComment;
                returnCursorComment.textContent = "...";

                const indicatorTimeout = window.setTimeout(() => {
                  if (!activeRepair || activeRepair.node !== node || !returnCursorComment) {
                    return;
                  }

                  returnCursorComment.textContent = "";
                  let charIndex = 0;

                  const typeNextCharacter = () => {
                    if (!activeRepair || activeRepair.node !== node || !returnCursorComment) {
                      return;
                    }

                    charIndex += 1;
                    returnCursorComment.textContent = fullComment.slice(0, charIndex);

                    if (charIndex < fullComment.length) {
                      const typingTimeout = window.setTimeout(typeNextCharacter, 40);
                      helperState.timeouts.push(typingTimeout);
                      return;
                    }

                    const holdTimeout = window.setTimeout(() => {
                      if (!activeRepair || activeRepair.node !== node) {
                        return;
                      }

                      returnCursor.classList.remove("is-commenting");
                      node.classList.remove("is-bot-pressing");
                      ensureAllRepairablesAtDefaultState();

                      if (repairQueue.length > 0) {
                        activeRepair = null;
                        processRepairQueue();
                        return;
                      }

                      const exitPoint = getRandomEdgePoint(originCenterX, originCenterY);
                      exitRepairCursor(helperState, exitPoint, 420);
                    }, 2000);

                    helperState.timeouts.push(holdTimeout);
                  };

                  typeNextCharacter();
                }, 420);

                helperState.timeouts.push(indicatorTimeout);
              };

              if (returnCursorComment && returnCursorLabel) {
                returnCursorComment.dataset.fullComment = fullComment;
                returnCursorLabel.style.opacity = "0";
                returnCursorComment.textContent = fullComment;

                requestAnimationFrame(() => {
                  if (!activeRepair || activeRepair.node !== node || !returnCursorLabel) {
                    return;
                  }

                  const labelRect = returnCursorLabel.getBoundingClientRect();
                  const viewportCenterX = window.innerWidth / 2;
                  const labelCenterX = labelRect.left + labelRect.width / 2;
                  const wouldOverflow =
                    labelRect.left < 16 || labelRect.right > window.innerWidth - 16;

                  if (!wouldOverflow) {
                    returnCursorLabel.style.opacity = "1";
                    startTypingSequence();
                    return;
                  }

                  const targetX = repairCursorPosition.x + (viewportCenterX - labelCenterX);
                  animateRepairCursorTo(
                    { x: targetX, y: repairCursorPosition.y },
                    260,
                    () => {
                      if (returnCursorLabel) {
                        returnCursorLabel.style.opacity = "1";
                      }
                      startTypingSequence();
                    }
                  );
                });
              } else {
                startTypingSequence();
              }
            }, 1000);

            helperState.timeouts.push(commentStartTimeout);
          };

          helperState.frameId = requestAnimationFrame(animateReturn);
        }, 140);

        helperState.timeouts.push(pressTimeout);
      }, 160);

      helperState.timeouts.push(hoverTimeout);
    };

    helperState.frameId = requestAnimationFrame(animateApproach);
    return true;
  };

  const startOrQueueMoveRepair = (node) => {
    resetStaleRepairState();
    pruneRepairQueue();

    if (activeRepair || activeRepairEdit || isMenuBlockingBot()) {
      queueRepair(node, "move");
      return;
    }

    if (!startMoveRepair(node)) {
      repairMoveSnapshots.delete(node);
      setRepairableOffset(node, 0, 0);
    }
  };

  const processRepairQueue = () => {
    resetStaleRepairState();
    pruneRepairQueue();

    if (activeRepair || activeRepairEdit || repairQueue.length === 0 || isMenuBlockingBot()) {
      return;
    }

    const { node, reason } = repairQueue.shift();
    const currentText = getRepairableText(node);
    const defaultText = repairableTextMap.get(node) || currentText;
    const rect = node.getBoundingClientRect();
    const moveSnapshot = repairMoveSnapshots.get(node);
    const currentOffset = moveSnapshot?.offset || getRepairableOffset(node);
    const currentCenterX = moveSnapshot?.centerX || rect.left + rect.width / 2;
    const currentCenterY = moveSnapshot?.centerY || rect.top + rect.height / 2;

    if (reason === "move") {
      if (!startMoveRepair(node, { continueFromCurrentCursor: true })) {
        processRepairQueue();
      }
      return;
    }

    if (currentText === defaultText) {
      clearRepairableEditState(node);
      node.style.minWidth = "";
      node.style.minHeight = "";
      processRepairQueue();
      return;
    }

    const centerX = currentCenterX;
    const centerY = currentCenterY;
    const startPoint =
      repairCursorVisible
        ? { x: repairCursorPosition.x, y: repairCursorPosition.y }
        : getRandomEdgePoint(centerX, centerY);
    const endPoint = {
      x: rect.left + rect.width - 10,
      y: rect.top + rect.height / 2,
    };
    const approachControl = getCurveControlPoint(startPoint, endPoint, 0.18);
    const helperState = { node, frameId: 0, timeouts: [] };

    activeRepair = helperState;
    positionRepairCursor(startPoint.x, startPoint.y);

    const approachStart = performance.now();
    const animateApproach = (now) => {
      const progress = Math.min((now - approachStart) / 520, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const nextPoint = getQuadraticPoint(startPoint, approachControl, endPoint, eased);
      positionRepairCursor(nextPoint.x, nextPoint.y);

      if (progress < 1) {
        helperState.frameId = requestAnimationFrame(animateApproach);
        return;
      }

      node.classList.add("is-text-editing");
      selectRepairable(node);
      let deleteIndex = currentText.length;
      const origin = repairOriginMap.get(node);
      const lockedLeft = origin?.left ?? rect.left - currentOffset.x;
      const lockedTop = origin?.top ?? rect.top - currentOffset.y;

      const sharedPrefixLength = (() => {
        const maxLength = Math.min(currentText.length, defaultText.length);
        let prefixLength = 0;
        while (
          prefixLength < maxLength &&
          currentText[prefixLength].toLowerCase() === defaultText[prefixLength].toLowerCase()
        ) {
          prefixLength += 1;
        }
        return prefixLength;
      })();

      node.style.minWidth = `${rect.width}px`;
      node.style.minHeight = `${rect.height}px`;
      setRepairableText(node, currentText, true);
      alignRepairableToLeftTop(node, lockedLeft, lockedTop);

      const beginRepairDelete = () => {
        if (!activeRepair || activeRepair.node !== node) {
          return;
        }

        const deleteNextCharacter = () => {
          if (!activeRepair || activeRepair.node !== node) {
            return;
          }

          deleteIndex -= 1;
          setRepairableText(node, currentText.slice(0, deleteIndex), true);
          alignRepairableToLeftTop(node, lockedLeft, lockedTop);

          if (deleteIndex > sharedPrefixLength) {
            const deleteTimeout = window.setTimeout(deleteNextCharacter, 55);
            helperState.timeouts.push(deleteTimeout);
            return;
          }

          let typeIndex = sharedPrefixLength;

          const typeNextCharacter = () => {
            if (!activeRepair || activeRepair.node !== node) {
              return;
            }

            typeIndex += 1;
            setRepairableText(node, defaultText.slice(0, typeIndex), true);
            alignRepairableToLeftTop(node, lockedLeft, lockedTop);

            if (typeIndex < defaultText.length) {
              const typeTimeout = window.setTimeout(typeNextCharacter, 88);
              helperState.timeouts.push(typeTimeout);
              return;
            }

            clearRepairableEditState(node);
            setRepairableText(node, defaultText);
            alignRepairableToLeftTop(node, lockedLeft, lockedTop);
            node.style.minWidth = "";
            node.style.minHeight = "";

            const commentStartTimeout = window.setTimeout(() => {
              if (!activeRepair || activeRepair.node !== node) {
                return;
              }

              returnCursor.classList.add("is-commenting");
              const fullComment = getRepairEditComment();
              returnCursorComment.dataset.fullComment = fullComment;
              returnCursorComment.textContent = "";
              let commentIndex = 0;

              const typeComment = () => {
                if (!activeRepair || activeRepair.node !== node) {
                  return;
                }

                commentIndex += 1;
                returnCursorComment.textContent = fullComment.slice(0, commentIndex);

                if (commentIndex < fullComment.length) {
                  const commentTimeout = window.setTimeout(typeComment, 28);
                  helperState.timeouts.push(commentTimeout);
                  return;
                }

                const holdTimeout = window.setTimeout(() => {
                  if (!activeRepair || activeRepair.node !== node) {
                    return;
                  }

                  returnCursor.classList.remove("is-commenting");
                  ensureAllRepairablesAtDefaultState();
                  pruneRepairQueue();

                  if (repairQueue.length > 0) {
                    activeRepair = null;
                    processRepairQueue();
                    return;
                  }

                  const exitPoint = getRandomEdgePoint(centerX, centerY);
                  exitRepairCursor(helperState, exitPoint, 520);
                }, 2000);

                helperState.timeouts.push(holdTimeout);
              };

              typeComment();
            }, 500);

            helperState.timeouts.push(commentStartTimeout);
          };

          const typeStartTimeout = window.setTimeout(typeNextCharacter, 280);
          helperState.timeouts.push(typeStartTimeout);
        };

        const deleteStartTimeout = window.setTimeout(deleteNextCharacter, 280);
        helperState.timeouts.push(deleteStartTimeout);
      };

      node.classList.add("is-bot-hover", "is-bot-pressing");

      const releaseFirstClick = window.setTimeout(() => {
        node.classList.remove("is-bot-pressing");
      }, 70);

      const startSecondClick = window.setTimeout(() => {
        if (!activeRepair || activeRepair.node !== node) {
          return;
        }

        node.classList.add("is-bot-pressing");
      }, 130);

      const finishDoubleClick = window.setTimeout(() => {
        if (!activeRepair || activeRepair.node !== node) {
          return;
        }

        clearRepairBotState(node);
        beginRepairDelete();
      }, 210);

      helperState.timeouts.push(releaseFirstClick, startSecondClick, finishDoubleClick);
    };

    helperState.frameId = requestAnimationFrame(animateApproach);
  };

    repairableTitles.forEach((node) => {
    const textNode = getRepairableTextNode(node);

    textNode?.addEventListener("blur", () => {
      if (activeRepairEdit?.node === node) {
        finalizeRepairableEdit(node);
      }
    });

    textNode?.addEventListener("keydown", (event) => {
      if (activeRepairEdit?.node !== node) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        finalizeRepairableEdit(node);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        finalizeRepairableEdit(node, { revert: true });
      }
    });

    textNode?.addEventListener("input", () => {
      if (activeRepairEdit?.node !== node) {
        return;
      }

      alignRepairableToLeftTop(node, activeRepairEdit.left, activeRepairEdit.top);
    });

    node.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      beginRepairableEdit(node);
    });

    node.addEventListener("pointerdown", (event) => {
      if (activeRepairEdit?.node === node) {
        return;
      }

      if (activeRepairEdit && activeRepairEdit.node !== node) {
        finalizeRepairableEdit(activeRepairEdit.node);
      }

      event.stopPropagation();
      event.preventDefault();
      selectRepairable(node);
      cancelRepairForNode(node);
      node.classList.add("is-pressing");

      const rect = node.getBoundingClientRect();
      const pointerId = event.pointerId;
      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const startOffset = getRepairableOffset(node);
      const startCenterX = rect.left + rect.width / 2;
      const startCenterY = rect.top + rect.height / 2;
      const moveThreshold = coarsePointer ? 8 : 3;
      let dragStarted = false;
      let didMove = false;
      let longPressTriggered = false;
      let longPressTimeoutId = 0;
      let gestureEnded = false;

      const startDrag = () => {
        if (dragStarted || longPressTriggered) {
          return;
        }

        dragStarted = true;
        node.classList.remove("is-pressing");
        node.classList.add("is-dragging");
      };

      if (coarsePointer) {
        longPressTimeoutId = window.setTimeout(() => {
          longPressTriggered = true;
          node.classList.remove("is-pressing");
          cleanupTitleListeners();
          beginRepairableEdit(node);
        }, LONG_PRESS_EDIT_DELAY_MS);
      }

      const moveTitle = (moveEvent) => {
        if (gestureEnded || moveEvent.pointerId !== pointerId || longPressTriggered) {
          return;
        }

        const deltaX = moveEvent.clientX - startClientX;
        const deltaY = moveEvent.clientY - startClientY;
        const travelDistance = Math.hypot(deltaX, deltaY);

        if (!dragStarted) {
          if (travelDistance < moveThreshold) {
            return;
          }

          if (longPressTimeoutId) {
            clearTimeout(longPressTimeoutId);
            longPressTimeoutId = 0;
          }

          startDrag();
        }

        didMove = true;
        const nextOffsetX = startOffset.x + deltaX;
        const nextOffsetY = startOffset.y + deltaY;
        setRepairableOffset(node, nextOffsetX, nextOffsetY);
        setSharedDragGuide(
          startCenterX,
          startCenterY,
          startCenterX + deltaX,
          startCenterY + deltaY
        );
      };

      const cleanupTitleListeners = () => {
        window.removeEventListener("pointermove", moveTitle);
        window.removeEventListener("pointerup", endGesture);
        window.removeEventListener("pointercancel", endGesture);
        window.removeEventListener("mouseup", endGesture);
        window.removeEventListener("touchend", endGesture);
      };

      const endGesture = (endEvent) => {
        if (gestureEnded) {
          return;
        }

        const isPointerEvent =
          typeof PointerEvent !== "undefined" && endEvent instanceof PointerEvent;
        if (isPointerEvent && endEvent.pointerId !== pointerId) {
          return;
        }

        gestureEnded = true;

        if (longPressTimeoutId) {
          clearTimeout(longPressTimeoutId);
          longPressTimeoutId = 0;
        }

        cleanupTitleListeners();

        if (longPressTriggered) {
          node.classList.remove("is-pressing");
          return;
        }

        if (!dragStarted) {
          node.classList.remove("is-pressing");
          clearSharedDragGuide();
          return;
        }

        node.classList.remove("is-pressing");
        node.classList.remove("is-dragging");
        clearSharedDragGuide();

        if (!didMove) {
          return;
        }

        const currentOffset = getRepairableOffset(node);
        const currentRect = node.getBoundingClientRect();
        if (Math.abs(currentOffset.x) < 1 && Math.abs(currentOffset.y) < 1) {
          setRepairableOffset(node, 0, 0);
          return;
        }

        totalMoveCount += 1;
        repairMoveSnapshots.set(node, {
          offset: { x: currentOffset.x, y: currentOffset.y },
          centerX: currentRect.left + currentRect.width / 2,
          centerY: currentRect.top + currentRect.height / 2,
        });

        const timeoutId = window.setTimeout(() => {
          pendingRepairTimeouts.delete(node);
          startOrQueueMoveRepair(node);
        }, 1000);

        pendingRepairTimeouts.set(node, { id: timeoutId, reason: "move" });
      };

      window.addEventListener("pointermove", moveTitle);
      window.addEventListener("pointerup", endGesture);
      window.addEventListener("pointercancel", endGesture);
      window.addEventListener("mouseup", endGesture);
      window.addEventListener("touchend", endGesture);
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (activeRepairEdit && !event.target.closest(".repairable-title")) {
      finalizeRepairableEdit(activeRepairEdit.node);
    }

    if (
      isBlankCanvasTarget(event.target) &&
      !event.target.closest("a, button, .repairable-title, .top-menu, .top-menu-toggle")
    ) {
      showBlankSelectionBox(event.clientX, event.clientY);
    } else {
      hideBlankSelectionBox();
    }

    if (!event.target.closest(".repairable-title")) {
      clearRepairableSelection();
    }
  });

  const lightbox = document.querySelector(".case-study-lightbox");
  if (lightbox) {
    const lightboxImage = lightbox.querySelector(".case-study-lightbox-image");
    const lightboxCaption = lightbox.querySelector(".case-study-lightbox-caption");
    const lightboxClose = lightbox.querySelector(".case-study-lightbox-close");
    const lightboxPrev = lightbox.querySelector(".case-study-lightbox-prev");
    const lightboxNext = lightbox.querySelector(".case-study-lightbox-next");
    const lightboxFrame = lightbox.querySelector(".case-study-lightbox-frame");
    const galleryImages = Array.from(document.querySelectorAll(".case-study-gallery img"));
    const imageData = galleryImages.map((img) => {
      const figure = img.closest("figure");
      const caption = figure ? figure.querySelector("figcaption") : null;
      return {
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || "Case study image",
        caption: caption ? caption.textContent : "",
      };
    });
    let activeIndex = 0;

    const renderLightbox = () => {
      const current = imageData[activeIndex];
      if (!current) {
        return;
      }
      lightboxImage.src = current.src;
      lightboxImage.alt = current.alt;
      lightboxCaption.textContent = current.caption || current.alt;
    };

    const openLightbox = (index) => {
      activeIndex = Math.max(0, Math.min(index, imageData.length - 1));
      renderLightbox();
      lightbox.classList.add("is-active");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
    };

    const closeLightbox = () => {
      lightbox.classList.remove("is-active");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
    };

    const showNext = () => {
      activeIndex = (activeIndex + 1) % imageData.length;
      renderLightbox();
    };

    const showPrev = () => {
      activeIndex = (activeIndex - 1 + imageData.length) % imageData.length;
      renderLightbox();
    };

    galleryImages.forEach((img, index) => {
      img.addEventListener("click", (event) => {
        event.preventDefault();
        openLightbox(index);
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", showPrev);
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", showNext);
    }

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    if (lightboxFrame) {
      lightboxFrame.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("is-active")) {
        return;
      }
      if (event.key === "Escape") {
        closeLightbox();
      }
      if (event.key === "ArrowRight") {
        showNext();
      }
      if (event.key === "ArrowLeft") {
        showPrev();
      }
    });
  }

  updateRepairableOrigins();
  window.addEventListener("resize", updateRepairableOrigins);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateRepairableOrigins);
  }
}
