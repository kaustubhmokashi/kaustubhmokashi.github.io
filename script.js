const cursor = document.querySelector(".personal-cursor");
const returnCursor = document.querySelector(".return-cursor");
const returnCursorComment = document.querySelector(".return-cursor-comment");
const returnCursorLabel = document.querySelector(".return-cursor-label");
const finePointer = window.matchMedia("(pointer: fine)").matches;

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
const draggableNames = [...document.querySelectorAll(".name-layer")];
const dragGuideLine = document.querySelector(".drag-guide-line");
const dragGuideLabel = document.querySelector(".drag-guide-label");
const dragGuideText = document.querySelector(".drag-guide-text");

if (stage && draggableNames.length) {
  let selectedName = null;
  let hasPositionedNames = false;
  let hasUserMovedName = false;
  let returnCursorVisible = false;
  let returnCursorPosition = { x: -9999, y: -9999 };
  const originMap = new Map();
  const pendingReturnTimeouts = new WeakMap();
  const returnQueue = [];
  let activeReturn = null;

  const selectName = (node) => {
    draggableNames.forEach((item) => item.classList.toggle("is-selected", item === node));
    selectedName = node;
  };

  const clearSelection = () => {
    draggableNames.forEach((item) => item.classList.remove("is-selected"));
    selectedName = null;
  };

  const centerNames = () => {
    const [firstName, secondName] = draggableNames;

    if (!firstName || !secondName) {
      return;
    }

    const stageWidth = window.innerWidth;
    const stageHeight = window.innerHeight;
    const firstRect = firstName.getBoundingClientRect();
    const secondRect = secondName.getBoundingClientRect();
    const groupHeight = firstRect.height + secondRect.height;
    const top = (stageHeight - groupHeight) / 2;

    firstName.style.left = `${(stageWidth - firstRect.width) / 2}px`;
    firstName.style.top = `${top}px`;
    secondName.style.left = `${(stageWidth - secondRect.width) / 2}px`;
    secondName.style.top = `${top + firstRect.height}px`;
    originMap.set(firstName, {
      left: (stageWidth - firstRect.width) / 2,
      top,
    });
    originMap.set(secondName, {
      left: (stageWidth - secondRect.width) / 2,
      top: top + firstRect.height,
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

    returnCursor.classList.remove("is-commenting");
    if (returnCursorComment) {
      returnCursorComment.textContent = returnCursorComment.dataset.fullComment || "";
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
  };

  const clearBotState = (node) => {
    node.classList.remove("is-bot-hover", "is-bot-pressing");
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
    const queueIndex = returnQueue.findIndex((item) => item === node);

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

  const processReturnQueue = () => {
    if (activeReturn || returnQueue.length === 0) {
      return;
    }

    const node = returnQueue.shift();
    const origin = originMap.get(node);

    if (!origin) {
      processReturnQueue();
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
              const fullComment = returnCursorComment?.dataset.fullComment || "";

              const startTypingSequence = () => {
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
              };

              if (returnCursorComment && returnCursorLabel) {
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
  selectName(draggableNames[0]);
  window.addEventListener("load", centerNames);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(centerNames);
  }

  draggableNames.forEach((node) => {
    node.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      selectName(node);

      if (activeReturn && activeReturn.node === node) {
        cancelAnimationFrame(activeReturn.frameId);
        clearHelperTimeouts(activeReturn);
        clearBotState(activeReturn.node);
        clearDragGuide();
        activeReturn = null;
        hideReturnCursor();
      }

      cancelReturnForNode(node);

      const rect = node.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const pointerId = event.pointerId;
      const startCenterX = rect.left + rect.width / 2;
      const startCenterY = rect.top + rect.height / 2;
      let didMoveElement = false;

      node.classList.add("is-dragging");
      node.setPointerCapture(pointerId);

      const moveName = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return;
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

        const timeoutId = window.setTimeout(() => {
          pendingReturnTimeouts.delete(node);
          removeQueuedReturn(node);
          returnQueue.push(node);
          processReturnQueue();
        }, 1000);

        pendingReturnTimeouts.set(node, timeoutId);
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
  });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".name-layer")) {
      clearSelection();
    }
  });
}
