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

const timerpageApi = ( packets, date_time ) => {
    let start = new Date().getTime();
    let details_dict = {}

    date_time[0] = convertDateToUTC(date_time[0]);
    date_time[1] = convertDateToUTC(date_time[1]);
    let new_packets = create_timer(packets);  //make it return number of stages also
    let numPhase = new_packets["numPhase"];
    new_packets = new_packets["new_packets"];
    let LS2 = new_packets[1][new_packets[1].length - 1];
    let LS3 = new_packets[2][new_packets[2].length - 1];
    let laststageTime = new Date(LS2*1000);
    let IT1 = new Date(
      date_time[0].getTime() + laststageTime.getSeconds()
    );
    laststageTime = new Date(LS3 * 1000);
    let IT2 = new Date(
      date_time[1].getTime() + laststageTime.getSeconds()
    );
    let currTime = new Date();
    let timeAllocated, timeLeft;
    if (currTime > IT1){
      timeAllocated = new_packets[0];
      timeLeft = findTimeLeft(currTime, IT1, timeAllocated);
    }
    else{
      timeAllocated = new_packets[1];
      timeLeft = findTimeLeft(currTime, IT2, timeAllocated);
    }
    console.log(timeAllocated);
    console.log(timeLeft);
    if ((timeLeft.reduce((a, b) => a + b, 0)) == 0){
      return false;
    }
    else{
      details_dict["pedTime"] = 0;
      details_dict["trafficPercent"] = Math.round(timeAllocated.reduce((a,b)=>a+b, 0)/2.55)
      
      let details_list = new Array(new_packets.length).fill({});
      for(let i = 0; i< numPhase;i++){
          road_dict = {}                               //this is the object for every stage
          road_dict['stageName'] = 'Stage ' + (i + 1).toString()
          road_dict['timeAllocated'] = timeAllocated[i]
          road_dict['timeleft'] = timeLeft[i]
          road_dict['amberTime'] = 5
          details_list[i] = road_dict
      }
      details_dict["stagesInfo"] = details_list;
      details_dict["systime"] = new Date().getTime();
      console.log("time Taken overall(in seconds):"+ (details_dict["systime"]-start)/1000);
      return details_dict;
    }
};

const create_timer = packets => {
  let new_packets = [], numPhase;
  packets.forEach(element => {
    let a = element;
    let offset_packet = [];
    for (let j = 0; j < a.length / 8; j++) {
      offset_packet.push(a.substring(j * 8, (j + 1) * 8));
      offset_packet[j] = parseInt(offset_packet[j], 2);
    }
    new_packets.push(offset_packet);
  });
  numPhase = new_packets[0][5];
  new_packets = new_packets.map(x => x.slice(6, 6 + numPhase));
  return {new_packets, numPhase};
};

const findTimeLeft = (currTime, IT, TA) => {
  currTime = new Date(currTime.getTime() + 19800000);
  console.log(currTime - IT);
  console.log(currTime);
  console.log(IT);
  let timeLeft = new Array(TA.length).fill(0);
  let diff = (currTime - IT)/1000;
  for(let i = 0; i < TA.length; i++){
    let stageTime = TA[i];
    console.log("st:"+stageTime);
    console.log("diff:" + diff);
    if(stageTime >= diff){
      timeLeft[i] = stageTime - diff;
      diff = 0
    }else{
      timeLeft[i] = 0;
      diff = diff - stageTime;
    }
  }
  return timeLeft;
};

module.exports = {
    timer : timerpageApi
}