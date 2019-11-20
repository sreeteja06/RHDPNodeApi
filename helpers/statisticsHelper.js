const DecodeSinglePacket = packet => {
  const a = packet;
  const offsetPacket = [];
  for (let j = 0; j < a.length / 8; j += 1) {
    offsetPacket.push(a.substring(j * 8, (j + 1) * 8));
    offsetPacket[j] = parseInt(offsetPacket[j], 2);
  }
  return offsetPacket;
};

const DecodePackets = packets => {
  const newPackets = [];
  packets.forEach(element => {
    newPackets.push(DecodeSinglePacket(element));
  });
  return newPackets;
};

/**
grpBy = Group By

1 for hour
 -> Hour of the 'Upload_Time'
2 for Morning/Afternoon/Evening/Night
/Night -> Morning: [6,7,8,9,10,11], Afternoon: [12,13,14,15,16], Evening: [17,18,19,20,21], Night: [22,23,0,1,2,3,4,5]
3 for Peak/Off-Peak
/Night -> Peak: [8,9,10,11,17,18,19,20], Off-Peak: [6,7,12,13,14,15,16,21], Night: [22,23,0,1,2,3,4,5]
4 for Day -> Day of Upload_Time
 (1,2...7)
5 for Month -> Month of Upload_Time (January,...December)
6 for Day in month -> Day of Week of Upload_Time (1,2.....31)
*/
const getGrpByFirstValue = (UploadTime, grpBy) => {
  if (grpBy === 1) {
    return new Date(UploadTime.toISOString().replace('Z', '')).getHours();
  }
  if (grpBy === 2) {
    // 0 - morning, 1 - afternoon, 2 - evening, 3 - night
    const x = new Date(UploadTime.toISOString().replace('Z', '')).getHours();
    if (x === 6 || x === 7 || x === 8 || x === 9 || x === 10 || x === 11) {
      return 0;
    } else if (x === 12 || x === 13 || x === 14 || x === 15 || x === 16) {
      return 1;
    } else if (x === 17 || x === 18 || x === 19 || x === 20 || x === 21) {
      return 2;
    }
    return 3;
  } else if (grpBy === 3) {
    // 0 - peak, 1 - off -peak
    const x = new Date(UploadTime.toISOString().replace('Z', '')).getHours();
    if (
      x === 8 ||
      x === 9 ||
      x === 10 ||
      x === 11 ||
      x === 17 ||
      x === 18 ||
      x === 19 ||
      x === 20
    ) {
      return 0;
    } else {
      return 1;
    }
  } else if (grpBy === 4) {
    // 0 - sunday, 1 - monday ......
    return new Date(UploadTime.toISOString().replace('Z', '')).getDay();
  } else if (grpBy === 5) {
    // 0 - jan, 1 - feb .......
    return new Date(UploadTime.toISOString().replace('Z', '')).getMonth();
  } else if (grpBy === 6) {
    return new Date(UploadTime.toISOString().replace('Z', '')).getDate() - 1;
  }
  return '';
};
const findAvgTime = (resArr, grpBy) => {
  let numPhase;
  const parsedArr = resArr.map(e => {
    const temp = [];
    temp.push(getGrpByFirstValue(e.Upload_Time, grpBy));
    let dPackets = [];
    dPackets = DecodeSinglePacket(e.Message);
    // eslint-disable-next-line prefer-destructuring
    numPhase = dPackets[5];
    dPackets = dPackets.slice(6, 6 + numPhase);
    temp.push(dPackets);
    // dPackets.forEach(e => {
    //   temp.push(e);
    // });
    return temp;
  });
  let n;
  if (grpBy === 5) {
    n = 12;
  } else if (grpBy === 4) {
    n = 7;
  } else if (grpBy === 2) {
    n = 4;
  } else if (grpBy === 1) {
    n = 24;
  } else if (grpBy === 3) {
    n = 2;
  } else if (grpBy === 6) {
    n = 31;
  }
  const length = new Array(n).fill(0);
  let res = new Array(n).fill(0);
  // eslint-disable-next-line no-unused-vars
  res = res.map(e => {
    return new Array(numPhase).fill(0);
  });
  parsedArr.forEach(e => {
    length[e[0]] += 1;
    res[e[0]] = res[e[0]].map((l, index) => {
      // eslint-disable-next-line
      return (l += e[1][index]);
    });
  });
  res = res.map((e, index) => {
    return e.map(l => {
      return Math.round(l / length[index]);
    });
  });
  return res;
};

const findDensity = packets => {
  const dPackets = DecodePackets(packets);
  let density = 0;
  dPackets.forEach(e => {
    density += e[4];
  });
  density /= dPackets.length;
  return Math.round(density / 2.55);
};

module.exports = {
  findDensity,
  findAvgTime
};
