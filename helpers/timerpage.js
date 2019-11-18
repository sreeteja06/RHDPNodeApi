/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
function convertDateToUTC(date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

const createTimer = packets => {
  const newPackets = [];
  packets.forEach(element => {
    const a = element;
    const offsetPacket = [];
    for (let j = 0; j < a.length / 8; j++) {
      offsetPacket.push(a.substring(j * 8, (j + 1) * 8));
      offsetPacket[j] = parseInt(offsetPacket[j], 2);
    }
    newPackets.push(offsetPacket);
  });
  const numPhase = newPackets[0].length;
  // newPackets = newPackets.map(x => x.slice(6, 6 + numPhase));
  return { newPackets, numPhase };
};

const findTimeLeft = (currTime, IT, TA) => {
  console.log(`TA: ${TA}`);
  const timeLeft = new Array(TA.length).fill(0);
  let diff = (currTime - IT) / 1000;
  for (let i = 0; i < TA.length; i++) {
    const stageTime = TA[i];
    console.log(`st:${stageTime}`);
    console.log(`diff:${diff}`);
    if (stageTime >= diff) {
      timeLeft[i] = stageTime - diff;
      diff = 0;
    } else {
      timeLeft[i] = 0;
      diff -= stageTime;
    }
  }
  return timeLeft;
};

const timerpageApi = (packets, dateTime) => {
  const start = new Date().getTime();
  const detailsDict = {};

  dateTime[0] = convertDateToUTC(dateTime[0]);
  dateTime[1] = convertDateToUTC(dateTime[1]);
  let newPackets = createTimer(packets); // make it return number of stages also
  const { numPhase } = newPackets;
  newPackets = newPackets.newPackets;
  const LS2 = newPackets[1][newPackets[1].length - 1];
  const LS3 = newPackets[2][newPackets[2].length - 1];
  console.log(`ls2: ${LS2}`);
  console.log(`ls3: ${LS3}`);
  let laststageTime = new Date(LS2 * 1000);
  const IT1 = new Date(dateTime[0].getTime() + laststageTime.getTime());
  laststageTime = new Date(LS3 * 1000);
  const IT2 = new Date(dateTime[1].getTime() + laststageTime.getTime());
  console.log(`IT1: ${IT1}`);
  console.log(`IT2: ${IT2}`);
  let currTime = new Date();
  currTime = new Date(currTime.getTime() + 19800000);
  let timeAllocated;
  let timeLeft;
  if (currTime > IT1) {
    timeAllocated = newPackets[0];
    timeLeft = findTimeLeft(currTime, IT1, timeAllocated);
  } else {
    timeAllocated = newPackets[1];
    timeLeft = findTimeLeft(currTime, IT2, timeAllocated);
  }
  console.log(`timeAllocated: ${timeAllocated}`);
  console.log(`timeLeft: ${timeLeft}`);
  if (timeLeft.reduce((a, b) => a + b, 0) == 0) {
    return false;
  } else {
    detailsDict.pedTime = 0;
    detailsDict.trafficPercent = Math.round(
      timeAllocated.reduce((a, b) => a + b, 0) / 2.55
    );

    const detailsList = new Array(newPackets.length).fill({});
    for (let i = 0; i < numPhase; i++) {
      const roadDict = {}; // this is the object for every stage
      roadDict.stageName = `Stage ${(i + 1).toString()}`;
      roadDict.timeAllocated = timeAllocated[i];
      roadDict.timeleft = timeLeft[i];
      roadDict.amberTime = 5;
      detailsList[i] = roadDict;
    }
    detailsDict.stagesInfo = detailsList;
    detailsDict.systime = new Date().getTime();
    console.log(
      `time Taken overall(in seconds):${(detailsDict.systime - start) / 1000}`
    );
    return detailsDict;
  }
};

module.exports = {
  timer: timerpageApi
};
