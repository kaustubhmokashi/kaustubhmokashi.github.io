const cursor = document.querySelector(".personal-cursor");
const returnCursor = document.querySelector(".return-cursor");
const returnCursorComment = document.querySelector(".return-cursor-comment");
const returnCursorLabel = document.querySelector(".return-cursor-label");
const returnCursorPrompt = document.querySelector(".return-cursor-prompt");
const topMenu = document.querySelector(".top-menu");
const topMenuToggle = document.querySelector(".top-menu-toggle");
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

if (cursor && finePointer) {
  const moveCursor = (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    cursor.style.opacity = "1";
  };

  const hideCursor = () => {
    cursor.style.opacity = "0";
  };

  const showCursor = (event) => {
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

if (topMenu && topMenuToggle) {
  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    topMenuToggle.setAttribute("aria-expanded", "false");
  };

  topMenuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = document.body.classList.toggle("menu-open");
    topMenuToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen && returnCursor) {
      returnCursor.style.opacity = "0";
      returnCursor.style.transform = "translate3d(-9999px, -9999px, 0)";
    }
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
  });
}

if (stage && draggableItems.length) {
  const getNodeTextElement = (node) => node.querySelector(".editable-text");
  const defaultTextMap = new Map(
    draggableItems.map((item) => [item, (getNodeTextElement(item)?.textContent || "").trim()])
  );
  const taglineNode = draggableItems.find(
    (item) => item.dataset.draggableName === "tagline"
  );
  const taglineDefaultText = defaultTextMap.get(taglineNode) || "";
  let selectedName = null;
  let hasPositionedNames = false;
  let hasUserMovedName = false;
  let totalMoveCount = 0;
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
    });
    originMap.set(secondName, {
      left: secondLeft,
      top: secondTop,
    });
    originMap.set(roleLayer, {
      left: firstLeft + firstRect.width / 2 - roleRect.width / 2,
      top: top - 43 - roleRect.height,
    });
    originMap.set(captionLayer, {
      left: secondLeft + secondRect.width / 2 - captionRect.width / 2,
      top: secondTop + secondRect.height + captionOffset,
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

  const removeQueuedReturn = (node) => {
    const queueIndex = returnQueue.findIndex((item) => item.node === node);

    if (queueIndex !== -1) {
      returnQueue.splice(queueIndex, 1);
    }
  };

  const cancelReturnForNode = (node) => {
    const pendingTimeout = pendingReturnTimeouts.get(node);

    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingReturnTimeouts.delete(node);
    }

    removeQueuedReturn(node);
    clearBotState(node);

    if (activeReturn && activeReturn.node === node) {
      cancelAnimationFrame(activeReturn.frameId);
      clearHelperTimeouts(activeReturn);
      activeReturn = null;
      clearDragGuide();
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
  };

  const resetTaglineDisplay = () => {
    if (taglineNode) {
      clearTextEditState(taglineNode);
    }

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
    removeQueuedReturn(node);
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

    pendingReturnTimeouts.set(node, timeoutId);
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
    cancelReturnForNode(node);
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

      const targetNode =
        draggableItems[Math.floor(Math.random() * draggableItems.length)];
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
                clearDragGuide();

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
    if (activeReturn || returnQueue.length === 0 || isMenuBlockingBot()) {
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
      const lockedCenterX = current.left + current.width / 2;
      const lockedCenterY = current.top + current.height / 2;

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

        pendingReturnTimeouts.set(node, timeoutId);
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
