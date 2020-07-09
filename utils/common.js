const sleep = (secs) => new Promise((_func) => setTimeout(_func, secs * 1000));

const getNthParent = async (node, n) => {
  if (n === 0) return node;

  await sleep(0.5);
  return getNthParent(await node.getProperty('parentNode'), n - 1);
};

module.exports = {
  getNthParent,
  sleep,
};
