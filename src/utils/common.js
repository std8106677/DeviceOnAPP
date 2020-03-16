import moment from 'moment';
import { Locales } from "../lang/language";

export const showRowNum = 20;
export var pageStore = {abnormal:{selStores:[],selDpt:[]},
              watch:{selStores:[]},
              good:{selStores:[]},
              transport:{selStores:[]}};
export function hasKey(array, key){ //arrary 中搜尋是否有對應值
  let result = false;
  _.map(array, i =>{
    if(i==key){
      result = true;
    }
  });
  return result;
}

export function sortByKey(array, key, isDateTime, needPadLeft, isDesc) {
  needPadLeft = (typeof needPadLeft == "undefined") ? false : needPadLeft;
  isDesc = (typeof isDesc == "undefined") ? false : isDesc;
  if(array) {
    return array.sort(function (a, b) {
      if(isDateTime){
        if(isDesc) {
          return moment.utc(b[key]).diff(moment.utc(a[key]))
        } else {
          return moment.utc(a[key]).diff(moment.utc(b[key]))
        }
      }else{
        var x = a[key];
        var y = b[key];
        if (needPadLeft) {
            let tempX = padLeft(a[key], 4);
            let tempY = padLeft(b[key], 4);
            x = tempX;
            y = tempY;
        }
        if(isDesc) {
          if(x && y) { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
          else if (x) { return -1; }
          else { return 1; }
        } else {
          if(x && y) { return ((x > y) ? 1 : ((x < y) ? -1 : 0)); }
          else if (x) { return 1; }
          else { return -1; }
        }
      }
    });
  } else {
    return [];
  }
}

export function sortByHans(array, key) {
  //return array.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', {sensitivity: 'accent'}))
  if(array) {
    return array.sort(function (a, b) {
      var x = a[key];
      var y = b[key];
      return x.localeCompare(y, 'zh-Hans-CN', {sensitivity: 'accent'});
    });
  } else {
    return [];
  }
}

export function padLeft(str,lenght){
  if(str.length >= lenght)
    return str;
  else
    return padLeft("0" +str,lenght);
}

Array.prototype.groupBy = function(groupKey,isDate) {
  return this.reduce(function(groups, item) {
    var val = item[groupKey];
    if(isDate){
      var val = moment(item[groupKey]).format("YYYY/MM/DD");
    }
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}

export function getSensorStatusName(index) {
  var status = index;
  switch(index) {
    case 1: status = Locales.sensorStatus.Idle; break;
    case 2: status = Locales.sensorStatus.OnCalibrating; break;
    case 3: status = Locales.sensorStatus.Malfunction; break;
    case 4: status = Locales.sensorStatus.Delete; break;
    case 10: status = Locales.sensorStatus.Backup; break;
    case 11: status = Locales.sensorStatus.Online; break;
    case 12: status = Locales.sensorStatus.Abnormal; break;
    case 13: status = Locales.sensorStatus.Offline; break;
    case 14: status = Locales.sensorStatus.Pause; break;
    case 15: status = Locales.sensorStatus.Mobile; break;
    case 17: status = Locales.sensorStatus.Initial; break;
  }
  return status;
}

export function getFreezerStatusName(index) {
  var status = index;
  switch(index) {
    case 1: status = Locales.freezerStatus.Idle; break;
    case 3: status = Locales.freezerStatus.Malfunction; break;
    case 4: status = Locales.freezerStatus.Delete; break;
    case 11: status = Locales.freezerStatus.Online; break;
    case 12: status = Locales.freezerStatus.Abnormal; break;
    case 14: status = Locales.freezerStatus.Pause; break;
    case 16: status = Locales.freezerStatus.Standby; break;
    case 17: status = Locales.freezerStatus.Initial; break;
  }
  return status;
}

Object.compare = function (obj1, obj2) {
	//Loop through properties in object 1
	for (var p in obj1) {
		//Check property exists on both objects
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

		switch (typeof (obj1[p])) {
			//Deep compare objects
			case 'object':
				if (!Object.compare(obj1[p], obj2[p])) return false;
				break;
			//Compare function code
			case 'function':
				if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
				break;
			//Compare values
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}

	//Check object 2 for any extra properties
	for (var p in obj2) {
		if (typeof (obj1[p]) == 'undefined') return false;
	}
	return true;
};

export function compareArray(arr1,arr2){
  if (!arr1  || !arr2) return;
  let result;
  arr1.forEach((e1,i)=>arr2.forEach(e2=>{
    if (e1.length > 1 && e2.length){
      result = compare(e1,e2);
    } else if (e1 !== e2 ){
      result = false;
    } else {
      result = true;
    }
  }));
  return result;
}

var branchType_order = [],
    branchRegion_order = [];
export function setBranchOrder(order) {
  //console.log("order, ", order);
  branchType_order = order.type_order;
  branchRegion_order = order.region_order;
}

export function parseStoreType(typeList) {
  let newList = [];
  for(let i=0 ; i<branchType_order.length ; ++i) {
    for(let j=0 ; j<typeList.length ; ++j) {
      if(typeList[j] == branchType_order[i]) {
        newList.push(typeList[j]);
        typeList.splice(j, 1);
        break;
      }
    }
  }
  for(let i=0 ; i<typeList.length ; ++i) {
    newList.push(typeList[i]);
  }
  return newList;
}

export function parseStoreRegion(typeList) {
  let newList = [];
  for(let i=0 ; i<branchRegion_order.length ; ++i) {
    for(let j=0 ; j<typeList.length ; ++j) {
      if(typeList[j] == branchRegion_order[i]) {
        newList.push(typeList[j]);
        typeList.splice(j, 1);
        break;
      }
    }
  }
  for(let i=0 ; i<typeList.length ; ++i) {
    newList.push(typeList[i]);
  }
  return newList;
}
