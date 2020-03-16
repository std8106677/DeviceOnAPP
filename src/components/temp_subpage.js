import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { Row, Col } from 'reactstrap';
import { setUpdateData } from "../actions";
import { apiDataRetrieve, apiFreezerCount, apiFreezerList, apiFreezerPause,
         apiFreezerResume, apiRuleTemplateList, apiRuleTemplateMonitorList,
         apiFreezerPropertyList, apiFreezerPropertyAdd, apiFreezerPropertyUpdate,toCancelApi ,apiRuleTemplateAlertList} from "../utils/api";
import { padLeft, sortByKey, getFreezerStatusName } from "../utils/common";
import { Redirect } from "react-router-dom";
import { Line } from "react-chartjs-2";
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import Select from 'react-select';
import Modal from 'react-modal';
import Moment  from '../components/moment_custom';
import ConfirmDialog from '../components/confirm_dialog';
import {CaretComp, CaretUpComp, CaretDownComp} from '../components/comp_caret';
import MultiSelect from '@khanacademy/react-multi-select';
import { Locales } from "../lang/language";
import BlockUi from 'react-block-ui';

const stopServiceModalStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '10%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    width: '500px',
    height: '80%',
    transform : 'translate(-50%, 0)',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
}

const maxFreezerDataSubDay = 31;

var timeoutIndex = "";
var autoReFreshSecond = 5 * 60;
var autoReFreshCoundDown = autoReFreshSecond;
function AutoReFresh(callBackFunc) {
  autoReFreshCoundDown--;
  if(autoReFreshCoundDown < 0 && callBackFunc) {
    callBackFunc();
    autoReFreshCoundDown = autoReFreshSecond;
  }
  timeoutIndex = setTimeout(AutoReFresh, 1000, callBackFunc);
}

class TempSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      chartBlocking: false,
      freezerDataSubDay: 0,
      showDataType: "abnormal",
      selectFreezer: "",
      selectStore: "",
      freezerCount: [],
      freezerList: [],
      freezerData: [],
      storeMap: [],
      departmentMap: [],

      searchString: "",
      departmentOptions: [],
      departmentSelect: [],

      showConfirmModal: false,
      showStopServiceModal: false,
      stopServiceTime: "",
      stopServiceReasonType: "",
      stopServiceReason: "",

      freezerPauseErrorMsg: "",
      temperatureRuleMap: [],
      temperatureRuleMonitorMap: [],
      alert_rule_id:"",
      sortField: "department_name",
      sortDesc: false,

      showDeFrostModal: false,
      freezerDeFrostTimes: [],
      freezerDeFrostTimes_OtherFreq: [],
      freezerDeFrostPropertyId: "",
      freezerDeFrostTimeHour: "",
      freezerDeFrostTimeMin: "",
      freezerDeFrostDuration: "",
      freezerDeFrostFrequencry: 4,
      lastUpdateTime: "",
      DataDate: new Date(moment().format("YYYY/MM/DD")),
    };
  }

  componentWillUnmount(){
    toCancelApi();
    //clearTimeout(timeoutIndex);
  }

  componentDidMount() {
    this.dataReFresh();
    //timeoutIndex = setTimeout(AutoReFresh, 3000, this.dataReFresh);
    //document.onmousedown = this.mouseClick;
  }

  mouseClick() {
    autoReFreshCoundDown = autoReFreshSecond;
  }

  componentWillReceiveProps(nextProps) {
    //console.log("nextProps, ", nextProps);
    if(this.state.blocking == false) {
      this.getResucerData(nextProps.store, nextProps.storeDepartment);
      this.getFreezerCount(nextProps.store, nextProps.storeDepartment);
      if(this.state.lastUpdateTime != moment().format("YYYY/MM/DD HH:mm:ss")) {
        this.setState({lastUpdateTime: moment().format("YYYY/MM/DD HH:mm:ss")}, function() {
          this.props.setUpdateData({type: "temp", time: this.state.lastUpdateTime});
        })
      }
    }
  }

  dataReFresh = () => {
    const {store, storeDepartment} = this.props;
    this.getResucerData(store, storeDepartment);
    this.getFreezerCount(store, storeDepartment);
    this.setDefaultAlertRuleID();
    this.getTemperatureMonitorRule();
    this.props.setUpdateData({type: "temp", time: moment().format("YYYY/MM/DD HH:mm:ss")});
  }

  setDefaultAlertRuleID = () => {
    const {token}=this.props;
    // get Role Template Alert list
    apiRuleTemplateAlertList({acc_id:this.props.user.acc_id,token})
      .then(
        function(response) {
          const  alertRulesData = response.data.alert_rules.filter(x=>  x.alert_rule_id.indexOf("sys_") == -1 && x.name.indexOf("Temperature Custom") > -1);
          let alert_rule_id = alertRulesData.length > 0 ?alertRulesData[0].alert_rule_id:"";
          this.setState({ alert_rule_id: alert_rule_id });
          this.getTemperatureRule();
        }.bind(this)
      )
      .catch(function(error) {
        console.log(error);
      });
  }
  getResucerData = (store, storeDepartment) => {
    var tmpStoreMap = [], tmpDepartmentMap = [], departmentOptions = [], departmentSelect = [];
    for(var i=0 ; i<store.length ; ++i) {
      tmpStoreMap[store[i].branch_id] = store[i].branch_name;
    }
    for(var i=0 ; i<storeDepartment.length ; ++i) {
      tmpDepartmentMap[storeDepartment[i].id] = storeDepartment[i].name;
      departmentOptions.push({label: storeDepartment[i].name, value: storeDepartment[i].id});
      departmentSelect.push(storeDepartment[i].id);
    }
    this.setState({storeMap: tmpStoreMap, departmentMap: tmpDepartmentMap, departmentOptions: departmentOptions, departmentSelect: departmentSelect});
  }

  getFreezerCount(store, storeDepartment) {
    const {token} = this.props;
    var storeIdList = [];
    //console.log("store, ", store);
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].select) {
        storeIdList.push(store[i].branch_id);
      }
    }
    //console.log("storeIdList, ", storeIdList);
    this.setState({freezerCount: []});
    if(storeIdList.length > 0) {
      var data = {
        branch_ids: storeIdList,
        token: token
      }
      this.setState({blocking: true});
      apiFreezerCount(data)
      .then(function (response) {
        //console.log("apiFreezerCount response, ", response.data);
        if(response.data.freezer_counts && response.data.freezer_counts.length > 0) {
          this.setState({freezerCount: response.data.freezer_counts, freezerList: [], selectStore: "", selectFreezer: ""});
          if(response.data.freezer_counts.length == 1) {
            this.getFreezerList(response.data.freezer_counts[0].branch_id);
          }
        }
        this.setState({blocking: false});
      }.bind(this))
      .catch(function (error) {
        console.log(error);
        this.setState({blocking: false});
      }.bind(this));
    }
  }

  getFreezerList(branchId) {
    this.setState({freezerList: []});
    const {token} = this.props;
    var data = {
      branch_id: branchId,
      token: token
    }
    apiFreezerList(data)
    .then(function (response) {
      //console.log("apiFreezerList response, ", response.data);
      var tmpFreezerList = [];
      for(var i=0 ; i<response.data.freezers.length ; ++i) {
        response.data.freezers[i].department_name = this.getDepartmentNameById(response.data.freezers[i].department_id);
        response.data.freezers[i].temperature = (response.data.freezers[i].last_data.value ? response.data.freezers[i].last_data.value.temperature : "");
        response.data.freezers[i].humidity = (response.data.freezers[i].last_data.value &&
                                              response.data.freezers[i].last_data.value.humidity != -9999) ?
                                              response.data.freezers[i].last_data.value.humidity : "";
        response.data.freezers[i].temp_standard = (response.data.freezers[i].rule_template_ids ? this.getRuleNameById(response.data.freezers[i].rule_template_ids[0]) : "");
        response.data.freezers[i].temp_upperlimit = (response.data.freezers[i].rule_template_ids ? this.getRuleTemperatureUpperLimitById(response.data.freezers[i].rule_template_ids[0]) : "");
        response.data.freezers[i].updatetime = (response.data.freezers[i].access_time ? response.data.freezers[i].access_time.last_data : "");
        response.data.freezers[i].changestatetime = (response.data.freezers[i].access_time ? response.data.freezers[i].access_time.last_transit : "");
        if(response.data.freezers[i].status != 4) {
          tmpFreezerList.push(response.data.freezers[i]);
        }
      }
      //console.log("tmpFreezerList, ", tmpFreezerList);
      this.setState({
        freezerList: sortByKey(tmpFreezerList, this.state.sortField, this.state.sortField == "updatetime", false, this.state.sortDesc),
        selectStore: branchId
      });
      //this.getFreezerProperty(response.data.freezers);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  getFreezerProperty(freezerlist) {
    for(var i=0 ; i<freezerlist.length ; ++i) {
      this.getFreezerPropertyByFreezerId(freezerlist[i].freezer_id)
    }
  }

  getFreezerPropertyByFreezerId(freezerId) {
    const {token} = this.props;
      var data = {
        freezer_id: freezerId,
        type: "defrost_time",
        token: token
      };
      apiFreezerPropertyList(data)
      .then(function (response) {
        if(response.data.propertys && response.data.propertys.length > 0) {
          var tmpFreezerList = JSON.parse(JSON.stringify(this.state.freezerList));
          for(var i=0 ; i<tmpFreezerList.length ; ++i) {
            if(tmpFreezerList[i].freezer_id == response.data.propertys[0].freezer_id) {
              tmpFreezerList[i].deFrostTime = response.data.propertys[0].data;
              tmpFreezerList[i].deFrostPropertyId = response.data.propertys[0].property_id;
              this.setState({ freezerList: tmpFreezerList });
              break;
            }
          }
        }
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
  }

  getTemperatureRule() {
    const {token, user} = this.props;
    let data = {
      acc_id: user.acc_id,
      token: token
    };
    apiRuleTemplateList(data)
    .then(function(response){
      if (response.data.status == 1) {
        let tmpRuleMap = [], template = response.data.rule_templates;
        _.map(template,temp=>{
          if(temp.alert_rule_id=="sys_temperature"||temp.alert_rule_id==this.state.alert_rule_id){
            tmpRuleMap[temp.rule_template_id] = {name: temp.name, monitor_id: temp.monitor_rule_id};
          }
        });
        this.setState({temperatureRuleMap: tmpRuleMap});
        //console.log("rule template",tmpRuleMap)
      } else {
        console.log("Get rule template error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  getTemperatureMonitorRule() {
    const {token, user} = this.props;
    //console.log("user, ", user);
    let data = {
      acc_id: user.acc_id,
      token: token
    };
    apiRuleTemplateMonitorList(data)
    .then(function(response){
      if (response.data.status == 1) {
        let tmpMonitorRuleMap = [], template = response.data.monitor_rules;
        _.map(template,temp=>{
          if(temp.item=="temperature"){
            tmpMonitorRuleMap[temp.monitor_rule_id] = temp.upper_limit;
          }
        });
        this.setState({temperatureRuleMonitorMap: tmpMonitorRuleMap});
        //console.log("rule template monitor",tmpMonitorRuleMap)
      } else {
        console.log("Get rule template error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  updateFreezerPropertyAPI() {
    const {token} = this.props;
    var timeFromTo = this.getDefrostTimeFromTo();
    var data = {
      property_id: this.state.freezerDeFrostPropertyId,
      type: "defrost_time",
      data: timeFromTo,
      token: token
    };
    apiFreezerPropertyUpdate(data)
    .then(function (response) {
      this.getFreezerPropertyByFreezerId(this.state.selectFreezer);
      this.handleCloseDeFrostModal();
    }.bind(this))
    .catch(function (error) {
      console.log("updateFreezerPropertyAPI error, ", error);
    });
  }

  addFreezerPropertyAPI() {
    const {token} = this.props;
    var timeFromTo = this.getDefrostTimeFromTo();
    var data = {
      freezer_id: this.state.selectFreezer,
      type: "defrost_time",
      data: timeFromTo,
      token: token
    };
    //console.log("addFreezerPropertyAPI data, ", data);
    apiFreezerPropertyAdd(data)
    .then(function (response) {
      //console.log("addFreezerPropertyAPI response, ", response);
      this.getFreezerPropertyByFreezerId(this.state.selectFreezer);
      this.handleCloseDeFrostModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  getDefrostTimeFromTo() {
    var timeFromTo = [], timeFrom = "", timeTo = "";
    if(this.state.freezerDeFrostFrequencry == "other") {
      for(let i=0 ; i<this.state.freezerDeFrostTimes_OtherFreq.length ; ++i) {
        timeFrom = this.state.freezerDeFrostTimes_OtherFreq[i].Hour + ":" + this.state.freezerDeFrostTimes_OtherFreq[i].Min;
        timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
        timeFromTo.push({from_to: [timeFrom, timeTo]});
      }
    } else {
      var frequencry = 24 / this.state.freezerDeFrostFrequencry
      timeFrom = this.state.freezerDeFrostTimeHour + ":" + this.state.freezerDeFrostTimeMin;
      timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
      timeFromTo.push({from_to: [timeFrom, timeTo]});
      for(let i=1 ; i<this.state.freezerDeFrostFrequencry ; ++i) {
        timeFrom = moment(timeFrom, "HH:mm").add(frequencry, "H").format("HH:mm");
        timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
        timeFromTo.push({from_to: [timeFrom, timeTo]});
      }
    }
    return timeFromTo;
  }

  getRuleNameById(id) {
    if(this.state.temperatureRuleMap[id]) {
      return this.state.temperatureRuleMap[id].name;
    } else {
      return "";
    }
  }

  getRuleTemperatureUpperLimitById(id) {
    if(this.state.temperatureRuleMap[id] != null && this.state.temperatureRuleMonitorMap[this.state.temperatureRuleMap[id].monitor_id] != null) {
      return this.state.temperatureRuleMonitorMap[this.state.temperatureRuleMap[id].monitor_id];
    } else {
      return "";
    }
  }

  callFreezerPause(period) {
    const {token, store, storeDepartment} = this.props;
    //console.log("this.state.selectStore && this.state.selectFreezer && this.state.stopServiceTime, ", this.state.selectStore + " / " + this.state.selectFreezer + " / " + this.state.stopServiceTime);
    if(this.state.selectStore && this.state.selectFreezer && this.state.stopServiceTime != "") {
      var data = {
        freezer_id: this.state.selectFreezer,
        period: this.state.stopServiceTime,
        reason: this.state.stopServiceReasonType == "other" ? this.state.stopServiceReason : this.state.stopServiceReasonType,
        token: token
      }
      //console.log("apiFreezerPause data, ", data);
      apiFreezerPause(data)
      .then(function (response) {
        //console.log("apiFreezerPause response, ", response.data);
        //this.setState({freezerList: response.data.freezers});
        //this.getFreezerList(this.state.selectStore);
        this.getFreezerCount(store, storeDepartment);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    }
  }

  callFreezerResume() {
    const {token, store, storeDepartment} = this.props;
    if(this.state.selectStore && this.state.selectFreezer) {
      //console.log("selectStore / selectFreezer, ", this.state.selectStore + " / " + this.state.selectFreezer);
      var data = {
        freezer_id: this.state.selectFreezer,
        token: token
      }
      apiFreezerResume(data)
      .then(function (response) {
        //console.log("apiFreezerResume response, ", response.data);
        //this.setState({freezerList: response.data.freezers});
        //this.getFreezerList(this.state.selectStore);
        this.getFreezerCount(store, storeDepartment);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    }
  }

  getFreezerDataRetrieve() {
    const {token}=this.props;
    var data = {
      type: "freezer",
      targetId: this.state.selectFreezer,
      startTime: moment().subtract(this.state.freezerDataSubDay, 'day').subtract(24, 'hour').format("YYYY-MM-DD HH:mm:ss"),
      endTime: moment().subtract(this.state.freezerDataSubDay, 'day').format("YYYY-MM-DD HH:mm:ss"),
      token: token
    }
    this.setState({freezerData: [], chartBlocking: true});
    apiDataRetrieve(data)
    .then(function (response) {
      var freezerData = [];
      //console.log("apiDataRetrieve response, ", response.data);
      for(let i=0 ; i<response.data.sensors.length ; ++i) {
        for(let j=0 ; j<response.data.sensors[i].sensor_datas.length ; ++j) {
          freezerData.push({
            time: moment(response.data.sensors[i].sensor_datas[j].timestamp*1000).utc().format("HH:mm   YYYY/MM/DD"),
            temperature: response.data.sensors[i].sensor_datas[j].value.temperature,
            humidity: response.data.sensors[i].sensor_datas[j].value.humidity
          });
        }
      }
      this.setState({freezerData: sortByKey(freezerData, "time", true), chartBlocking: false});
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({chartBlocking: false});
    });
  }

  getStoreNameById(storeId) {
    if(this.state.storeMap[storeId]) {
      return this.state.storeMap[storeId];
    } else {
      return storeId;
    }
  }

  getDepartmentNameById(depId) {
    if(this.state.departmentMap[depId]) {
      return this.state.departmentMap[depId];
    } else {
      return "";
    }
  }

  handleClickFreezer(e, id) {
    e.stopPropagation();
    if(id != this.state.selectFreezer) {
      this.setState({selectFreezer: id, freezerDataSubDay: 0}, function() {
        this.getFreezerDataRetrieve();
      });
      this.getFreezerPropertyByFreezerId(id);
    }
  }

  handleClickBranch(e, branchId) {
    e.stopPropagation();
    if(branchId != this.state.selectStore) {
      this.getFreezerList(branchId);
      var departmentSelect = [];
      for(var i=0 ; i<this.state.departmentOptions.length ; ++i) {
        departmentSelect.push(this.state.departmentOptions[i].value);
      }
      this.setState({selectStore: branchId, searchString: "", departmentSelect: departmentSelect});
    }
  }

  handleClickStoreOutside(e) {
    if (this.state.selectFreezer != "") {
      this.setState({selectFreezer: ""});
    } else if (this.state.selectStore != "" && this.state.freezerCount.length > 1) {
      this.setState({selectStore: ""});
    }
  }

  handleClickOutside(e) {
    if (this.state.selectFreezer != "") {
      this.setState({selectFreezer: ""});
    }
  }

  handleOpenConfirmModal = () => {
    this.setState({ showConfirmModal: true });
  }
  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false });
  }
  handleResumePauseFreezer = () => {
    this.callFreezerResume();
    this.handleCloseConfirmModal();
  }

  handleOpenStopServiceModal = () => {
    this.setState({
      showStopServiceModal: true,
      stopServiceTime: "",
      stopServiceReasonType: "",
      stopServiceReason: "",
      freezerPauseErrorMsg: "" });
  }
  handleCloseStopServiceModal = () => {
    this.setState({ showStopServiceModal: false });
  }
  handleStopServiceReasonChange = (event) => {
    this.setState({stopServiceReason: event.target.value});
  }
  handleStopService = () => {
    //console.log("handleStopService");
    if(this.state.stopServiceTime == "") {
      this.setState({freezerPauseErrorMsg: Locales.temperature.請設定暫停持續時間});
    } else {
      this.callFreezerPause();
      this.handleCloseStopServiceModal();
    }
  }

  checkDefrostFreq(times) {
    let result = false;
    if(times.length > 1) {
      result = true;
      let duration1 = 24 / times.length;
      console.log("duration1, ", duration1);
      for(let i=1 ; i<times.length ; ++i) {
        let time1 = moment(times[i-1].from_to[0], "HH:mm");
        let time2 = moment(times[i].from_to[0], "HH:mm");
        if (time2 < time1) { time2.add(24, "hour"); }
        let duration2 = moment.duration(time2.diff(time1)).asHours();
        console.log("duration2, ", duration2);
        if(duration1 != duration2) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  handleOpenDeFrostModal = () => {
    for(var i=0 ; i<this.state.freezerList.length ; ++i) {
      if(this.state.freezerList[i].freezer_id == this.state.selectFreezer) {
        //console.log("this.state.freezerList[i], ", this.state.freezerList[i]);
        var tmpDefrostTime_OtherFreq = [], defrostFrequencry = 4;
        if(this.state.freezerList[i].deFrostTime && this.state.freezerList[i].deFrostTime.length > 1) {
          tmpDefrostTime_OtherFreq = [{ Hour: this.state.freezerList[i].deFrostTime[0].from_to[0].split(":")[0],
                                        Min: this.state.freezerList[i].deFrostTime[0].from_to[0].split(":")[1] }];
          if(this.checkDefrostFreq(this.state.freezerList[i].deFrostTime)) {
            defrostFrequencry = this.state.freezerList[i].deFrostTime.length;
          } else {
            defrostFrequencry = "other";
            for(let j=1 ; j<this.state.freezerList[i].deFrostTime.length ; ++j) {
              tmpDefrostTime_OtherFreq.push({ Hour: this.state.freezerList[i].deFrostTime[j].from_to[0].split(":")[0],
                                              Min: this.state.freezerList[i].deFrostTime[j].from_to[0].split(":")[1] });
            }
          }
        }
        this.setState({ showDeFrostModal: true,
                        freezerDeFrostTimes: [],
                        freezerDeFrostTimes_OtherFreq: tmpDefrostTime_OtherFreq,
                        freezerDeFrostDuration: this.state.freezerList[i].defrosting_duration,
                        freezerDeFrostFrequencry: defrostFrequencry,
                        freezerDeFrostTimeHour: (this.state.freezerList[i].deFrostTime && this.state.freezerList[i].deFrostTime.length > 0) ? this.state.freezerList[i].deFrostTime[0].from_to[0].split(":")[0] : "",
                        freezerDeFrostTimeMin: (this.state.freezerList[i].deFrostTime && this.state.freezerList[i].deFrostTime.length > 0) ? this.state.freezerList[i].deFrostTime[0].from_to[0].split(":")[1] : "",
                        freezerDeFrostPropertyId: this.state.freezerList[i].deFrostPropertyId || ""}, function() {
          this.handleDefrostTimeChange();
        });
        break;
      }
    }
  }
  handleCloseDeFrostModal = () => {
    this.setState({ showDeFrostModal: false });
  }
  handleDeFrost = () => {
    //console.log("this.state.freezerDeFrostPropertyId, ", this.state.freezerDeFrostPropertyId);
    //console.log("getDefrostTimeFromTo(), ", this.getDefrostTimeFromTo());
    if(this.state.freezerDeFrostPropertyId == "") {
      this.addFreezerPropertyAPI();
    } else {
      this.updateFreezerPropertyAPI();
    }
  }

  getFreezerCountByStatus(status, freezerCount) {
    var count = 0;
    switch(status) {
      case "abnormal":
        count = freezerCount.temp_status.abnormal;
      break;
      case "normal":
        count = ( freezerCount.freezer_status.online - freezerCount.temp_status.abnormal );
      break;
      case "uncontrolled":
        count = ( /*freezerCount.freezer_status.delete + */freezerCount.freezer_status.idle + freezerCount.freezer_status.malfunction +
                  freezerCount.freezer_status.pause  + freezerCount.freezer_status.abnormal  + freezerCount.freezer_status.standby +
                  freezerCount.freezer_status.initial );
      break;
      case "all":
        count = ( /*freezerCount.freezer_status.delete + */freezerCount.freezer_status.idle + freezerCount.freezer_status.malfunction +
                  freezerCount.freezer_status.pause + freezerCount.freezer_status.abnormal + freezerCount.freezer_status.standby +
                  freezerCount.freezer_status.online + freezerCount.freezer_status.initial );
      break;
    }
    return count;
  }

  renderInfoGrid(title, index) {
    var totalCount=0, count=0, percentage="0%", typeColor="white";
    for(var i=0 ; i<this.state.freezerCount.length ; ++i) {
      count += this.getFreezerCountByStatus(index, this.state.freezerCount[i]);
      totalCount += this.getFreezerCountByStatus("all", this.state.freezerCount[i]);
    }
    if(count > 0) {
      percentage = Math.round( count / totalCount * 100 ) + '%';
    }
    switch(index) {
      case "abnormal": typeColor = "#FC616C"; break;
      case "normal": typeColor = "#00B5EF"; break;
      case "uncontrolled": typeColor = "#00C5B7"; break;
      case "all": typeColor = "#82D235"; break;
    }
    var InfoGridstyle = { marginTop:"20px", marginBottom:"15px", paddingTop : "10px", border:"0px solid white" };
    if (index == this.state.showDataType) {
      InfoGridstyle.marginTop = "10px";
      InfoGridstyle.paddingTop = "15px";
      InfoGridstyle.paddingBottom = "15px";
      InfoGridstyle.marginBottom = "5px";
      InfoGridstyle.border = "0px";
      InfoGridstyle.color = "white";
      InfoGridstyle.backgroundColor = typeColor;
    }
    var departmentSelect = [];
    for(var i=0 ; i<this.state.departmentOptions.length ; ++i) {
      departmentSelect.push(this.state.departmentOptions[i].value);
    }
    return (
      <Col lg={3} md={6} sm={12}>
        <div style={InfoGridstyle} className="shadow InfoGrid" onClick={() => this.setState({showDataType: index, searchString: "", departmentSelect})}>
          <Col md={6} style={{height: "80px"}} >
            <span style={{fontSize: "60px"}}>{count}</span>
          </Col>
          <Col md={6} style={{fontSize: "30px", paddingTop: "30px"}}>{percentage}</Col>
          <Col md={12} style={{height: "45px",  fontSize: "25px", color: "white", backgroundColor: typeColor}}>{title}</Col>
        </div>
      </Col>
    );
  }

  handleSelectedChanged(departmentSelect) {
    this.setState({departmentSelect});
  }

  renderDataList() {
    var count=0;
    for(var i=0 ; i<this.state.freezerCount.length ; ++i) {
      count += this.getFreezerCountByStatus(this.state.showDataType, this.state.freezerCount[i]);
    }
    if (this.state.freezerCount.length > 1 && count > 0) {
      return this.renderStoreList();
    } else if (this.state.freezerCount.length == 1 && count > 0) {
      return (
        <div>
          <div className="shadow" width="100%" style={{backgroundColor: "white"}}>
            <span style={{fontSize: "28px", padding: "20px 0 0px 30px", display: "inline-block"}}>{this.getStoreNameById(this.state.freezerCount[0].branch_id)}</span>
            <span style={{float: "right", paddingRight: "30px"}}>
              {/*<span style={{fontSize: "48px"}}>{count}</span>
              <span style={{fontSize: "28px", paddingLeft: "10px"}}>{"筆"}</span>*/}
              <span onClick={e=>e.stopPropagation()} style={{display: "inline-block", width: "300px", verticalAlign: "middle"}}>
                <MultiSelect
            		  options={this.state.departmentOptions}
            		  selected={this.state.departmentSelect}
                  onSelectedChanged={this.handleSelectedChanged.bind(this)}
                  disabled={false}
                  disableSearch={true}
                  overrideStrings={{
                    selectSomeItems: Locales.common.請選擇部門地點,
                    allItemsAreSelected: Locales.common.所有部門地點,
                    selectAll: Locales.common.所有部門地點,
                    search: "Search",
                  }}
                />
              </span>
              <input type="text" className="InputStyle" placeholder={Locales.temperature.請輸入欲查詢的冷凍櫃名稱} value={this.state.searchString} onClick={e=>e.stopPropagation()}
                style={{width: "330px", margin: "20px 0 0 10px"}} onChange={e=>this.setState({searchString: e.target.value})}>
              </input>
            </span>
            { this.renderFreezerList() }
          </div>
          <br />
        </div>
      );
    }
  }

  renderStoreList() {
    return _.map(this.state.freezerCount, branch => {
      var count = this.getFreezerCountByStatus(this.state.showDataType, branch);
      if (count > 0) {
        if(this.state.selectStore == branch.branch_id) {
          return (
            <div key={branch.branch_id}>
              <div className="shadow" width="100%" style={{backgroundColor: "white"}}>
                <span style={{fontSize: "28px", padding: "20px 0 0px 30px", display: "inline-block"}}>{this.getStoreNameById(branch.branch_id)}</span>
                <span style={{float: "right", paddingRight: "30px"}}>
                  {/*<span style={{fontSize: "48px"}}>{count}</span>
                  <span style={{fontSize: "28px", paddingLeft: "10px"}}>{"筆"}</span>*/}
                  <span onClick={e=>e.stopPropagation()} style={{display: "inline-block", width: "300px", verticalAlign: "middle"}}>
                    <MultiSelect
                		  options={this.state.departmentOptions}
                		  selected={this.state.departmentSelect}
                      onSelectedChanged={this.handleSelectedChanged.bind(this)}
                      disabled={false}
                      disableSearch={true}
                      overrideStrings={{
                        selectSomeItems: Locales.common.請選擇部門地點,
                        allItemsAreSelected: Locales.common.所有部門地點,
                        selectAll: Locales.common.所有部門地點,
                        search: "Search",
                      }}
                    />
                  </span>
                  <input type="text" className="InputStyle" placeholder={Locales.temperature.請輸入欲查詢的冷凍櫃名稱} value={this.state.searchString} onClick={e=>e.stopPropagation()}
                    style={{width: "330px", margin: "20px 0 0 10px"}} onChange={e=>this.setState({searchString: e.target.value})}>
                  </input>
                </span>
                { this.renderFreezerList() }
              </div>
              <br />
            </div>
          );
        } else {
          return (
            <div key={branch.branch_id} onClick={(e)=>this.handleClickBranch(e, branch.branch_id)}>
              <div className="shadow" width="100%" style={{backgroundColor: "white", height: "110px"}}>
                <span style={{fontSize: "28px", display: "inline-block", padding: "35px 0 0 20px"}}>{this.getStoreNameById(branch.branch_id)}</span>
                <span style={{float: "right", padding: "20px 30px 0px 0px"}}>
                  <span style={{fontSize: "48px"}}>{count}</span>
                  <span style={{fontSize: "28px", paddingLeft: "10px"}}>{Locales.common.筆}</span>
                </span>
              </div>
              <br />
            </div>
          );
        }
      }
    });
  }

  checkFreezerStatus(freezer) {
    switch(this.state.showDataType) {
      case "all":
        return true;
      break;
      case "abnormal":
        if(freezer.temp_status == 151) { return true; }
      break;
      case "normal":
        if(this.transFreezerStatus(freezer.status) == this.state.showDataType && freezer.temp_status == 150) { return true; }
      break;
      default:
        if(this.transFreezerStatus(freezer.status) == this.state.showDataType) { return true; }
      break;
    }
    return false;
  }

  checkFreezerName(name) {
    if(this.state.searchString == "") {
      return true;
    } else {
      return ~name.indexOf(this.state.searchString);
    }
  }

  checkFreezerDepartment(id) {
    //console.log("id, ", id);
    //console.log("this.state.departmentSelect, ", this.state.departmentSelect);
    //console.log("this.state.departmentSelect.includes(id), ", this.state.departmentSelect.includes(id));
    if(this.state.departmentSelect.length == this.state.departmentOptions.length) {
      return true;
    } else {
      return this.state.departmentSelect.includes(id);
    }
  }

  renderFreezerList() {
    return (
      <div>
        <div>
        { this.renderFreezerListByType("normal") }
        </div>
        <br/>
        <div>
        { this.renderFreezerListByType("table") }
        </div>
      </div>
    );
  }

  handleClickField = (e, field) => {
    var isDateTime = (field == "updatetime") ? true : false;
    e.stopPropagation();
    if (this.state.sortField == field) {
      this.setState({sortDesc: !this.state.sortDesc}, function() {
        this.setState({freezerList: sortByKey(this.state.freezerList, field, isDateTime, false, this.state.sortDesc)})
      });
    } else {
      this.setState({sortField: field, sortDesc: true}, function() {
        this.setState({freezerList: sortByKey(this.state.freezerList, field, isDateTime, false, this.state.sortDesc)})
      });
    }
  }

  renderCaretByField(field) {
    if (this.state.sortField != field) {
      return <CaretComp/>
    } else {
      if (this.state.sortDesc == true) {
        return <CaretUpComp/>
      } else {
        return <CaretDownComp/>
      }
    }
  }

  renderFreezerListByType(type) {
    var title = (type == "table" ? Locales.temperature.冰台 : Locales.temperature.一般冰箱);
    var count = 0, statusCountText = "", idleCount = 0, malfunctionCount = 0, pauseCount = 0,
        abnormalCount = 0, standbyCount = 0, initialCount = 0;
    for(let i=0 ; i<this.state.freezerList.length ; ++i) {
      if (  this.checkFreezerStatus(this.state.freezerList[i]) &&
            this.checkFreezerName(this.state.freezerList[i].name) && this.checkFreezerDepartment(this.state.freezerList[i].department_id) &&
            (type == this.state.freezerList[i].type_id || (type == "normal" && this.state.freezerList[i].type_id != "table")) ) // check freezer type
      {
        count++;
        if(type == "normal" && this.state.showDataType == "uncontrolled") {
          switch(this.state.freezerList[i].status) {
            case 1: idleCount++; break;
            case 3: malfunctionCount++; break;
            case 12: abnormalCount++; break;
            case 14: pauseCount++; break;
            case 16: standbyCount++; break;
            case 17: initialCount++; break;
          }
        }
      }
    }
    var firstElement = false;
    if(idleCount > 0) {
      statusCountText += Locales.freezerStatus.Idle + " " + idleCount + " " + Locales.common.台;
      firstElement = true;
    }
    if(malfunctionCount > 0) {
      if(firstElement) { statusCountText += " / ";
      } else { firstElement = true; }
      statusCountText += Locales.freezerStatus.Malfunction + " " + malfunctionCount + " " + Locales.common.台;
    }
    if(abnormalCount > 0) {
      if(firstElement) { statusCountText += " / ";
      } else { firstElement = true; }
      statusCountText += Locales.freezerStatus.Abnormal + " " + abnormalCount + " " + Locales.common.台;
    }
    if(pauseCount > 0) {
      if(firstElement) { statusCountText += " / ";
      } else { firstElement = true; }
      statusCountText += Locales.freezerStatus.Pause + " " + pauseCount + " " + Locales.common.台;
    }
    if(standbyCount > 0) {
      if(firstElement) { statusCountText += " / ";
      } else { firstElement = true; }
      statusCountText += Locales.freezerStatus.Standby + " " + standbyCount + " " + Locales.common.台;
    }
    if(initialCount > 0) {
      if(firstElement) { statusCountText += " / ";
      } else { firstElement = true; }
      statusCountText += Locales.freezerStatus.Initial + " " + initialCount + " " + Locales.common.台;
    }
    return (
      <div className="InfoList" onClick={(e) => this.handleClickOutside(e)}>
        <div style={{paddingLeft: "26px", paddingTop: "30px", display: "inline-block", fontSize: "18px"}}>{title}</div>
        <div style={{float: "right", padding: "20px 26px 10px 0px"}}>
          <span style={{display: statusCountText == "" ? "none" : "", paddingRight: "20px", fontSize: "1vw"}}>{statusCountText}</span>
          <span style={{fontSize: "48px"}}>{count}</span>
          <span style={{fontSize: "28px", paddingLeft: "10px"}}>{Locales.common.筆}</span>
        </div>
        <div style={{padding: "26px"}}>
          <table style={{width:"100%"}}>
            <tbody>
              <tr className="rowDataHeader sortTable">
                <td width="20%">
                  <span onClick={(e)=>this.handleClickField(e,"name")}>{Locales.temperature.冷凍櫃}
                    { this.renderCaretByField("name") }
                  </span>
                </td>
                {/*<td width="10%">門市</td>*/}
                <td width="10%">
                  <span onClick={(e)=>this.handleClickField(e,"department_name")}>{Locales.temperature.部門}
                    { this.renderCaretByField("department_name") }
                  </span>
                </td>
                <td width="8%">
                  <span onClick={(e)=>this.handleClickField(e,"temperature")}>{Locales.temperature.溫度}
                    { this.renderCaretByField("temperature") }
                  </span>
                </td>
                <td width="8%">
                  <span onClick={(e)=>this.handleClickField(e,"humidity")}>{Locales.temperature.濕度}
                    { this.renderCaretByField("humidity") }
                  </span>
                </td>
                <td width="20%">
                  <span onClick={(e)=>this.handleClickField(e,"temp_standard")}>{Locales.temperature.溫度標準}
                    { this.renderCaretByField("temp_standard") }
                  </span>
                </td>
                <td width="8%">
                  <span onClick={(e)=>this.handleClickField(e,"temp_upperlimit")}>{Locales.temperature.溫度上限}
                    { this.renderCaretByField("temp_upperlimit") }
                  </span>
                </td>
                <td width="10%">
                  <span onClick={(e)=>this.handleClickField(e,"updatetime")}>{Locales.temperature.最近更新時間}
                    { this.renderCaretByField("updatetime") }
                  </span>
                </td>
                <td width="16%">
                  <span onClick={(e)=>this.handleClickField(e,"status")}>{Locales.temperature.狀態變更時間}
                    { this.renderCaretByField("status") }
                  </span>
                </td>
              </tr>
            </tbody>
            <tbody>
              { this.renderFreezerDataList(type) }
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  transFreezerStatus(status) {
    var statusString = "";
    switch(status) {
      case 1:
      case 3:
      //case 4:
      case 12:
      case 14:
      case 16:
      case 17:
        statusString = "uncontrolled";
      break;
      case 11:
        statusString = "normal";
      break;
    }
    return statusString;
  }

  renderFreezerDataList(type) {
    const {user} = this.props;
    let checkOperating = false;
    if(user.user_id && user.auth_info.webpage ){
      let operatingAuth = user.auth_info.webpage.find(x=>(x.page_id =="OperatingDeviceStatus" && x.auth.indexOf("read") > -1) );
      checkOperating = operatingAuth ? true:false;
    }
    return _.map(this.state.freezerList, freezer => {
      if ( this.checkFreezerStatus(freezer) && this.checkFreezerName(freezer.name) && this.checkFreezerDepartment(freezer.department_id) &&
          (type == freezer.type_id || (type == "normal" && freezer.type_id != "table"))) // check freezer type
      {
        if(freezer.freezer_id != this.state.selectFreezer) {
          return (
            <tr key={freezer.freezer_id} className="rowDataContent" onClick={(e) => this.handleClickFreezer(e, freezer.freezer_id)}>
              <td>{freezer.name}</td>
              {/*<td>{this.getStoreNameById(freezer.branch_id)}</td>*/}
              <td>{freezer.department_name}</td>
              <td style={freezer.temp_status == 151 ? {color: "#FF8373"} : {}}>
                {freezer.temperature + "" != "" ? freezer.temperature + "°C" : ""}
              </td>
              <td>{freezer.humidity + "" != "" ? freezer.humidity + "%" : ""}</td>
              <td>{freezer.temp_standard}</td>
              <td>{freezer.temp_upperlimit + "" != "" ? freezer.temp_upperlimit + "°C" : ""}</td>
              <td>
              <Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${freezer.updatetime}`}</Moment></td>
              <td>
                <span style={freezer.status == 12 || (freezer.status == 1 && type == "normal") ? {color: "#FF8373"} : {}}>
                  {getFreezerStatusName(freezer.status)}
                </span><br/>
                <span><Moment style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${freezer.changestatetime}`}</Moment>
               </span>
              </td>
            </tr>
          );
        } else {
          return (
            <tr key={freezer.freezer_id}>
							<td colSpan="8">
								<table className="SelectInfo">
                  <tbody>
                    <tr className="rowDataContent">
                      <td width="20%">{freezer.name}</td>
                      {/*<td width="10%">{this.getStoreNameById(freezer.branch_id)}</td>*/}
                      <td width="10%">{freezer.department_name}</td>
                      <td width="8%" style={freezer.temp_status == 151 ? {color: "#FF8373"} : {}}>
                        {freezer.temperature + "" != "" ? freezer.temperature + "°C" : ""}
                      </td>
                      <td width="8%">{freezer.humidity + "" != "" ? freezer.humidity + "%" : ""}</td>
                      <td width="20%">{freezer.temp_standard}</td>
                      <td width="8%">{freezer.temp_upperlimit + "" != "" ? freezer.temp_upperlimit + "°C" : ""}</td>
                      <td width="13%"><Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${freezer.updatetime}`}</Moment></td>
                      <td width="13%">
                        <span style={freezer.status == 12 || (freezer.status == 1 && type == "normal") ? {color: "#FF8373"} : {}}>
                          {getFreezerStatusName(freezer.status)}
                        </span><br/>
                        <span><Moment style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${freezer.changestatetime}`}</Moment></span>
                      </td>
                    </tr>
                    <tr onClick={(e)=>this.handleClickFreezer(e, freezer.freezer_id)}>
                      <td colSpan="8" style={{padding: "10px"}}>
                        <Tabs id="tempTabs" animation={true} className="tabStyle">
                          { this.renderTempInfoTab("temp") }
                          { this.renderTempInfoTab("humidity") }
                          <Tab eventKey={"defrost"} title={Locales.common.設定}>
                            <div style={{padding: "40px 10px", textAlign: "left", minHeight: "330px"}}>
                              <Button className="BtnStyle"
                                      style={{display: freezer.status == 11 || freezer.status == 12 || freezer.status == 16 || freezer.status == 17 ? "inline-block" : "none"}}
                                      disabled={!checkOperating}
                                      onClick={this.handleOpenStopServiceModal}>{Locales.temperature.冰箱暫停使用}</Button>
                              <Button className="BtnStyle"
                                      style={{display: freezer.status == 14 ? "inline-block" : "none"}}
                                      disabled={!checkOperating}
                                      onClick={this.handleOpenConfirmModal}>{Locales.temperature.解除冰箱暫停使用}</Button>
                              <Button className="BtnStyle"
                                      disabled={!checkOperating || typeof freezer.deFrostPropertyId == "undefined" || freezer.defrosting_enable != "true"}
                                      onClick={this.handleOpenDeFrostModal}>{Locales.temperature.調整除霜時間}</Button>
                            </div>
                          </Tab>
                        </Tabs>
                      </td>
                    </tr>
                  </tbody>
  							</table>
              </td>
            </tr>
          );
        }
      }
    });
  }

  renderPauseFreezerModal() {
    const timeOptions = [
      {value: "60", label: "1"+Locales.common.小時},
      {value: "120", label: "2"+Locales.common.小時},
      {value: "240", label: "4"+Locales.common.小時},
      {value: "480", label: "8"+Locales.common.小時},
      {value: "720", label: "12"+Locales.common.小時},
      {value: "1440", label: "1"+Locales.common.天},
      {value: "2880", label: "2"+Locales.common.天},
      {value: "0", label: Locales.common.直到手動恢復}
    ];
    const reasonOptions = [
      {value: "清洗", label: Locales.temperature.清洗},
      {value: "除霜", label: Locales.temperature.除霜},
      {value: "冰箱異常或故障", label: Locales.temperature.冰箱異常或故障},
      {value: "other", label: Locales.common.其他}
    ]
    return (
      <div onClick={e=>e.stopPropagation()}>
        <Modal
          isOpen={this.state.showStopServiceModal}
          style={stopServiceModalStyles}
          onRequestClose={this.handleCloseStopServiceModal}
          shouldCloseOnOverlayClick={true}
          contentLabel="">
          <div width="100%" style={{padding: "10px"}}>
            <span style={{fontSize: "36px"}}>{Locales.temperature.冰箱暫停使用}</span><br/><br/>
            <div style={{textAlign: "center", color: "red"}}>{this.state.freezerPauseErrorMsg}</div>
            <span>{Locales.temperature.暫停持續時間}：</span>
            <div style={{width: "300px", display: "inline-block"}}>
              <Select options={timeOptions} placeholder={Locales.common.請選擇} onChange={e=>this.setState({stopServiceTime: e.value})}/>
            </div><br/><br/>
            <span>{Locales.temperature.暫停使用原因}：</span>
            <div style={{width: "300px", display: "inline-block"}}>
              <Select options={reasonOptions} placeholder={Locales.common.請選擇} onChange={e=>this.setState({stopServiceReasonType: e.value})}/>
            </div><br/><br/>
            <textarea
              style={{resize: "none", display: this.state.stopServiceReasonType == "other" ? "block" : "none", width: "100%", height: "150px"}}
              value={this.state.stopServiceReason} onChange={this.handleStopServiceReasonChange}>
            </textarea>
            <div className="confirmBtn">
              <Button onClick={this.handleCloseStopServiceModal}>{Locales.common.取消}</Button>
              <Button onClick={this.handleStopService}>{Locales.common.確定}</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  renderConfirmPauseFreezerModal() {
    if(this.state.showConfirmModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.temperature.確定解除暫停使用嗎}
            confirmCB={this.handleResumePauseFreezer}
            cancelCB={this.handleCloseConfirmModal}
          />
        </div>
      );
    }
  }

  handleDefrostTimeHourChange = (e) => {
    this.setState({ freezerDeFrostTimeHour: e.value}, function() {
      this.handleDefrostTimeChange();
    });
  }

  handleDefrostTimeMinChange = (e) => {
    this.setState({ freezerDeFrostTimeMin: e.value}, function() {
      this.handleDefrostTimeChange();
    });
  }

  handleDefrostTimeChange = () => {
    if(this.state.freezerDeFrostTimeHour && this.state.freezerDeFrostTimeMin && this.state.freezerDeFrostDuration && this.state.freezerDeFrostFrequencry) {
      var timeFromTo = [], timeFrom = "", timeTo = "";
      //console.log("this.state.freezerDeFrostFrequencry, ", this.state.freezerDeFrostFrequencry);
      if(this.state.freezerDeFrostFrequencry != "other") {
        var frequencry = 24 / this.state.freezerDeFrostFrequencry
        timeFrom = this.state.freezerDeFrostTimeHour + ":" + this.state.freezerDeFrostTimeMin;
        timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
        timeFromTo.push(timeFrom + " ~ " + timeTo);
        for(let i=1 ; i<this.state.freezerDeFrostFrequencry ; ++i) {
          timeFrom = moment(timeFrom, "HH:mm").add(frequencry, "H").format("HH:mm");
          timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
          timeFromTo.push(timeFrom + " ~ " + timeTo);
        }
      }
      this.setState({ freezerDeFrostTimes: timeFromTo});
    }
  }

  renderDeFrostModal() {
    var timeHourOptions = [], timeMinOptions = [];
    for(var i=0 ; i<24 ; ++i) {
      timeHourOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    for(var i=0 ; i<60 ; ++i) {
      timeMinOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    return (
      <div onClick={e=>e.stopPropagation()}>
        <Modal
          isOpen={this.state.showDeFrostModal}
          style={stopServiceModalStyles}
          onRequestClose={this.handleCloseDeFrostModal}
          shouldCloseOnOverlayClick={true}
          contentLabel="">
          <div width="100%" style={{paddingTop: "20px"}}>
            <span style={{fontSize: "36px"}}>{Locales.temperature.調整除霜時間}</span><br/><br/>
            <div style={{display: this.state.freezerDeFrostFrequencry == "other" ? "none" : ""}}>
              <span style={{marginRight: "20px"}}>{Locales.temperature.除霜開始時間}</span>
              <div style={{width: "100px", display: "inline-block"}}>
                <Select
                  options={timeHourOptions}
                  placeholder={""}
                  value={timeHourOptions.filter(option=>option.value==this.state.freezerDeFrostTimeHour)}
                  onChange={this.handleDefrostTimeHourChange}
                />
              </div>
              <span> : </span>
              <div style={{width: "100px", display: "inline-block"}}>
                <Select
                  options={timeMinOptions}
                  placeholder={""}
                  value={timeMinOptions.filter(option=>option.value==this.state.freezerDeFrostTimeMin)}
                  onChange={this.handleDefrostTimeMinChange}
                />
              </div>
            </div>
            <div style={{margin: "10px 0", display: this.state.freezerDeFrostFrequencry == "other" ? "none" : ""}}>
              <span style={{marginRight: "20px"}}>{Locales.temperature.持續時間}</span><br/>
              <Row>
                { this.renderDeFrostTimes() }
              </Row>
            </div>
            <div style={{margin: "10px 0", display: this.state.freezerDeFrostFrequencry == "other" ? "" : "none"}}>
              <span style={{marginRight: "20px"}}>{Locales.temperature.除霜開始時間}</span>
              { this.renderDeFrostTimes_OtherFreq() }
            </div>
            <div className="confirmBtn">
              <Button onClick={this.handleCloseDeFrostModal}>{Locales.common.取消}</Button>
              <Button onClick={this.handleDeFrost}>{Locales.common.確定}</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  renderDeFrostTimes() {
    return _.map(this.state.freezerDeFrostTimes, time => {
      return (
        <Col key={Math.random()} md={4} style={{textAlign: "center"}}>
          <span>{time}</span>
        </Col>
      )
    });
  }

  renderDeFrostTimes_OtherFreq() {
    var timeHourOptions = [], timeMinOptions = [];
    for(var i=0 ; i<24 ; ++i) {
      timeHourOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    for(var i=0 ; i<60 ; ++i) {
      timeMinOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    var index = -1;
    return _.map(this.state.freezerDeFrostTimes_OtherFreq, time => {
      index++;
      let indexTmp = index;
      return (
        <div key={Math.random()} style={{margin: "10px 0"}}>
          <div style={{width: "100px", display: "inline-block"}}>
            <Select
              options={timeHourOptions}
              placeholder={""}
              value={timeHourOptions.filter(option=>option.value==time.Hour)}
              onChange={(e)=>this.handleDefrostTimeOtherFreqChange(e,indexTmp,"Hour")}
            />
          </div>
          <span> : </span>
          <div style={{width: "100px", display: "inline-block"}}>
            <Select
              options={timeMinOptions}
              placeholder={""}
              value={timeMinOptions.filter(option=>option.value==time.Min)}
              onChange={(e)=>this.handleDefrostTimeOtherFreqChange(e,indexTmp,"Min")}
            />
          </div>
        </div>
      )
    });
  }

  handleDefrostTimeOtherFreqChange(e, index, type) {
    var tmpFrostTimes = JSON.parse(JSON.stringify(this.state.freezerDeFrostTimes_OtherFreq));
    if(tmpFrostTimes[index] != null) {
      if(type == "Hour") {
        tmpFrostTimes[index].Hour = e.value
      } else if (type == "Min") {
        tmpFrostTimes[index].Min = e.value
      }
    }
    this.setState({freezerDeFrostTimes_OtherFreq: tmpFrostTimes});
  }

  handleFromChange = (DataDate) => {
    var freezerDataSubDay = 0;
    if(moment(DataDate).format("YYYY/MM/DD") != moment().format("YYYY/MM/DD")) {
      freezerDataSubDay = moment().diff(moment(DataDate), 'days');
    }
    this.setState({ DataDate, freezerDataSubDay },function() {
      this.getFreezerDataRetrieve();
    });
  }

  renderTempInfoTab(type) {
    var data = {}, title = (type == "temp") ? Locales.temperature.近期溫度紀錄 : Locales.temperature.近期濕度紀錄;
    var labels = [], datas = [];
    labels.push(moment().subtract(this.state.freezerDataSubDay, 'day').subtract(24.5, 'hour').format("HH:mm   YYYY/MM/DD"));
    datas.push(null);
    if(this.state.freezerData.length > 0) {
      for(var i=0 ; i<this.state.freezerData.length ; ++i) {
        if(this.state.freezerData[i].time != "Invalid date") {
          if(labels.length > 0) {
            let intervals = moment.duration(moment(this.state.freezerData[i].time).diff(moment(labels[labels.length-1]))).asMinutes();
            //console.log("intervals, ", intervals);
            if(intervals > 30) {
              labels.push(moment(this.state.freezerData[i].time).add(intervals / 2, 'minutes').format("HH:mm   YYYY/MM/DD"));
              datas.push(null);
            }
          }
          labels.push(this.state.freezerData[i].time);
          datas.push((type == "temp") ? this.state.freezerData[i].temperature : this.state.freezerData[i].humidity);
        }
      }
      labels.push(moment().subtract(this.state.freezerDataSubDay, 'day').add(0.5, 'hour').format("HH:mm   YYYY/MM/DD"));
      datas.push(null);
    } else {
      labels.push(moment().subtract(this.state.freezerDataSubDay, 'day').format("HH:mm   YYYY/MM/DD"));
      datas.push(null);
    }
    data = {
      labels: labels,
      datasets: [{
        label: ' ',
        fill: false,
        backgroundColor: 'rgba(255,101,101,0.2)',
        borderColor: 'rgba(255,101,101,1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255,101,101,1)',
        hoverBackgroundColor: 'rgba(255,101,101,0.4)',
        hoverBorderColor: 'rgba(255,101,101,1)',
        data: datas
      }]
    };
    var options = {
      tooltips: {
        filter: function (tooltipItem) {
          return tooltipItem.datasetIndex === 0;  // only show first hover tip
        }
      },
      elements: {
        line: {
          tension: 0  // no curve
        }
      },
      legend: { display: false },
      scales: {
  			xAxes: [{
          type: 'time',
          time: {
            unit: 'hour',
            unitStepSize: 3,
            displayFormats: {
             'hour': 'MM/DD HH:mm',
           }
          },
  				gridLines: { display: false },
  			}],
  			yAxes: [{
          ticks: {
            //suggestedMin: -30,
            //beginAtZero: false,   // minimum value will be 0.
            callback: function(value, index) {
              if(type == 'temp') { return value + '°C'; }
              else { return value + '%'; }
            }
          }
  			}]
  		},
    }
    return (
      <Tab eventKey={type} title={title}>
        <div style={{textAlign: "left", marginTop: "10px"}}>
          <Button disabled={this.state.freezerDataSubDay >= maxFreezerDataSubDay}
            onClick={()=>this.changeFreezerDataSubDay(1)}>前一天</Button>&nbsp;
          <Button disabled={this.state.freezerDataSubDay <= 0}
            onClick={()=>this.changeFreezerDataSubDay(-1)}>後一天</Button>
          <span className="ExportReportDayPicker" style={{marginLeft: "10px"}}>
            <DayPickerInput
              value={this.state.DataDate}
              format='YYYY/MM/DD'
              formatDate={formatDate}
              parseDate={parseDate}
              onDayChange={this.handleFromChange}
              dayPickerProps={{
                disabledDays: {
                  before: moment().subtract(maxFreezerDataSubDay, 'day').toDate(),
                  after: moment().toDate()
                }
              }}
            />
          </span>
        </div>
        <BlockUi tag="div" blocking={this.state.chartBlocking} message={Locales.common.加載中}>
          <div style={{padding: "40px 0"}}>
              <Line
              data={data}
              options={options}
              height={50} />
          </div>
        </BlockUi>
      </Tab>
    );
  }

  changeFreezerDataSubDay(value) {
    var freezerDataSubDay = this.state.freezerDataSubDay + value;
    var tmpDate = moment(this.state.DataDate);
    if(value == 1) {
      tmpDate.subtract(1, 'days');
    } else {
      tmpDate.add(1, 'days');
    }
    var DataDate = new Date(tmpDate.format("YYYY/MM/DD"));
    this.setState({freezerDataSubDay, DataDate}, function() {
      this.getFreezerDataRetrieve();
    })
  }

  render() {
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
        <div className="Subpage" onClick={(e) => this.handleClickStoreOutside(e)}>
          { this.renderPauseFreezerModal() }
          { this.renderConfirmPauseFreezerModal() }
          { this.renderDeFrostModal() }
          <Row>
            { this.renderInfoGrid(Locales.temperature.溫度異常, "abnormal") }
            { this.renderInfoGrid(Locales.temperature.溫度正常, "normal") }
            { this.renderInfoGrid(Locales.temperature.未受監控的冰箱, "uncontrolled") }
            { this.renderInfoGrid(Locales.temperature.全部冰箱, "all") }
          </Row>
          <br />
          { this.renderDataList() }
        </div>
      </BlockUi>
    );
  }
}

function mapStateToProps({ store, storeDepartment, token, user, updateData }, ownProps) {
  return { store, storeDepartment, token , user, updateData };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setUpdateData })(TempSubpage);
