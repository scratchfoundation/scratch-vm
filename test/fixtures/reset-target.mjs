/* eslint-disable no-param-reassign */
const resetTarget = (target) => {
    target.x = 0;
    target.y = 0;
    target.direction = 90;
    target.stopAllThreads();
    target.deleteAllThreads();
};

export default resetTarget;
