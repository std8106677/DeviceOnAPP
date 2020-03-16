import React, { Component } from "react";
import { connect } from "react-redux";
import { apiFreezerList, apiFreezerAdd, apiFreezerUpdate, apiFreezerDelete,
         apiRuleTemplateList, apiFreezerPropertyList, apiFreezerPropertyAdd,
         apiFreezerPropertyUpdate, apiFreezerPropertyDelete, toCancelApi,
         apiRuleTemplateAlertList } from "../utils/api";
import { padLeft, sortByKey, getFreezerStatusName } from "../utils/common";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import Select from 'react-select';
import moment from 'moment';
import ConfirmDialog from '../components/confirm_dialog';
import AlertDialog from '../components/alert_dialog';
import { Row, Col } from 'reactstrap';
import filterFactory, {
  selectFilter,
  textFilter
} from "react-bootstrap-table2-filter";
import {CompTable} from "../components/comp_Table";
import { Locales } from "../lang/language";
import BlockUi from 'react-block-ui';

const customStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '5%',
    left: 'calc(50% - 280px)',
    right: '0px',
    bottom: '0px',
    width: '570px',
    height: '90%',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};

class FreezerSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      selectStoreID: "",
      freezerList: [],
      showAddFreezerModal: false,
      showModifyFreezerModal: false,
      freezerId: "",
      freezerName: "",
      freezerType: "",
      freezerDepartmentId: "",
      freezerTemperatureRuleId: "",
      freezerBusinessTimePropertyId: "",
      freezerBusinessTimeFrom: -1,
      freezerBusinessTimeTo: -1,
      enableDefrost: false,
      freezerDeFrostMode: "regular",
      freezerDeFrostPropertyId: "",
      freezerDeFrostTimeHour: "08",
      freezerDeFrostTimeMin: "00",
      freezerDeFrostDuration: 40,
      freezerDeFrostFrequencry: 4,
      freezerDeFrostTimes: [],
      freezerDeFrostTimes_OtherFreq: [{Hour: "", Min: ""}],
      showConfirmModal: false,
      showAlertModal: false,
      confirmDeleteFreezerName: "",
      confirmDeleteFreezerId: "",
      temperatureRuleList: [],
      alert_rule_id:"",
      freezerNameNull: false,
      freezerDepartmentNull: false,
    };
  }

  componentWillUnmount(){
    toCancelApi();
  }

  componentDidMount() {
    const { store } = this.props;
    this.setDefaultAlertRuleID();
    this.getFreezerData(store);
  }

  componentWillReceiveProps(nextProps) {
    this.getFreezerData(nextProps.store);
  }

  setDefaultAlertRuleID = () => {
    const {token}=this.props;
    // get Role Template Alert list
    apiRuleTemplateAlertList({acc_id:this.props.user.acc_id,token})
    .then(
      function(response) {
        const alertRulesData = response.data.alert_rules.filter(x=>  x.alert_rule_id.indexOf("sys_") == -1 && x.name.indexOf("Temperature Custom") > -1);
        let alert_rule_id = alertRulesData.length > 0 ? alertRulesData[0].alert_rule_id : "";
        this.setState({
          alert_rule_id: alert_rule_id
        });
        this.getTemperatureRule();
      }.bind(this)
    )
    .catch(function(error) {
      console.log(error);
    });
  }
  getFreezerData(store) {
    for(let i=0 ; i<store.length ; ++i) {
      if(store[i].select) {
        this.setState({ selectStoreID: store[i].branch_id });
        this.getFreezerDataByStore(store[i].branch_id);
        break;
      }
    }
  }

  getFreezerDataByStore(storeId) {
    const {token} = this.props;
    var data = { branch_id: storeId, token: token };
    this.setState({blocking: true});
    apiFreezerList(data)
    .then(function (response) {
      var tmpFreezerList = [];
      for(let i=0 ; i<response.data.freezers.length ; ++i) {
        if(response.data.freezers[i].status != 4) {
          tmpFreezerList.push(response.data.freezers[i]);
        }
      }
      this.setState({ freezerList: [] });
      this.setState({ freezerList: sortByKey(tmpFreezerList, "name"), blocking: false });
      //this.getFreezerProperty(tmpFreezerList);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({blocking: false});
    }.bind(this));
  }

  getFreezerPropertyByFreezerId(freezerId, callBackFunc) {
    const {token} = this.props;
    var data = {
      freezer_id: freezerId,
      type: "defrost_time",
      token: token
    };
    apiFreezerPropertyList(data)
    .then(function (response) {
      if(response.data.propertys.length > 0) {
        var tmpFreezerList = JSON.parse(JSON.stringify(this.state.freezerList));
        for(var i=0 ; i<tmpFreezerList.length ; ++i) {
          if(tmpFreezerList[i].freezer_id == response.data.propertys[0].freezer_id) {
            tmpFreezerList[i].deFrostTime = response.data.propertys[0].data;
            tmpFreezerList[i].deFrostPropertyId = response.data.propertys[0].property_id;
            this.setState({ freezerList: [] });
            this.setState({ freezerList: tmpFreezerList }, function() {
              this.getFreezerProperty_Business(freezerId, callBackFunc);
            });
            break;
          }
        }
      } else {
        this.getFreezerProperty_Business(freezerId, callBackFunc);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  getFreezerProperty_Business(freezerId, callBackFunc) {
    const {token} = this.props;
    var data = {
      freezer_id: freezerId,
      date: moment().format("YYYY/MM/DD"),
      range: "mm",
      type: "business_hour",
      token: token
    };
    apiFreezerPropertyList(data)
    .then(function (response) {
      if(response.data.propertys.length > 0 && response.data.propertys[0].data.length > 0 && response.data.propertys[0].data[0].from_to.length > 1) {
        var tmpFreezerList = JSON.parse(JSON.stringify(this.state.freezerList));
        for(var i=0 ; i<tmpFreezerList.length ; ++i) {
          if(tmpFreezerList[i].freezer_id == response.data.propertys[0].freezer_id) {
            tmpFreezerList[i].businessTimeFrom = response.data.propertys[0].data[0].from_to[0];
            tmpFreezerList[i].businessTimeTo = response.data.propertys[0].data[0].from_to[1];
            tmpFreezerList[i].freezerBusinessTimePropertyId = response.data.propertys[0].property_id;
            this.setState({ freezerList: [] });
            this.setState({ freezerList: tmpFreezerList });
            break;
          }
        }
      }
      if(callBackFunc) {
        callBackFunc();
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  getTemperatureRule() {
    const {token, user, store} = this.props;
    let data = {
      acc_id: user.acc_id,
      token: token
    };
    apiRuleTemplateList(data)
    .then(function(response){
      if (response.data.status == 1) {
        let list = [], template = response.data.rule_templates;
        sortByKey(template, "code", false, true, false);
        _.map(template,temp=>{
          if(temp.alert_rule_id == "sys_temperature" || temp.alert_rule_id == this.state.alert_rule_id) {
            list.push(temp);
          }
        });
        this.setState({temperatureRuleList: list}, function() {
          this.getFreezerData(store);
        });
      } else {
        console.log("Get rule template error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleOpenAddFreezerModal = () => {
    this.setState({ freezerId: "", freezerName: "", freezerDeFrostPropertyId: "",
                    freezerBusinessTimePropertyId: "", showAddFreezerModal: true,
                    freezerNameNull: false, freezerDepartmentNull: false });
  }
  handleCloseAddFreezerModal = () => {
    this.setState({ showAddFreezerModal: false });
  }

  checkDefrostFreq(times) {
    let result = false;
    if(times.length > 1) {
      result = true;
      let duration1 = 24 / times.length;
      for(let i=1 ; i<times.length ; ++i) {
        let time1 = moment(times[i-1].from_to[0], "HH:mm");
        let time2 = moment(times[i].from_to[0], "HH:mm");
        if (time2 < time1) { time2.add(24, "hour"); }
        let duration2 = moment.duration(time2.diff(time1)).asHours();
        if(duration1 != duration2) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  getFreezerPropertyCallBackFunc = () => {
    var data = {};
    for(var i=0 ; i<this.state.freezerList.length ; ++i) {
      if(this.state.freezerList[i].freezer_id == this.state.freezerId) {
        data = this.state.freezerList[i];
        break;
      }
    }
    var defrostTimeHour = "08", defrostTimeMin = "00", defrostFrequencry = 4, tmpDefrostTime_otherFreq = [{Hour: "", Min: ""}];
    if( (typeof data.deFrostTime != "undefined") && data.deFrostTime.length > 0 && data.deFrostTime[0].from_to ) {
      tmpDefrostTime_otherFreq = [{Hour: data.deFrostTime[0].from_to[0].split(":")[0], Min: data.deFrostTime[0].from_to[0].split(":")[1]}]
      defrostTimeHour = data.deFrostTime[0].from_to[0].split(":")[0];
      defrostTimeMin = data.deFrostTime[0].from_to[0].split(":")[1];
      if(data.deFrostTime.length > 1) {
        if(this.checkDefrostFreq(data.deFrostTime)) {
          defrostFrequencry = data.deFrostTime.length;
        } else {
          defrostFrequencry = "other";
          for(let i=1 ; i<data.deFrostTime.length ; ++i) {
            tmpDefrostTime_otherFreq.push({Hour: data.deFrostTime[i].from_to[0].split(":")[0], Min: data.deFrostTime[i].from_to[0].split(":")[1]});
          }
        }
      } else {
        defrostFrequencry = data.deFrostTime.length;
      }
    }
    this.setState({ freezerDeFrostPropertyId: data.deFrostPropertyId,
                    freezerBusinessTimePropertyId: data.freezerBusinessTimePropertyId,
                    freezerDeFrostDuration: data.defrost ? data.defrost.duration : data.defrosting_duration,
                    freezerDeFrostTimeHour: defrostTimeHour,
                    freezerDeFrostTimeMin: defrostTimeMin,
                    freezerDeFrostFrequencry: defrostFrequencry,
                    freezerDeFrostTimes_OtherFreq: tmpDefrostTime_otherFreq,
                    freezerBusinessTimeFrom: data.businessTimeFrom,
                    freezerBusinessTimeTo: data.businessTimeTo }, function() {
                      this.handleDefrostTimeChange();
                    });
  }

  handleOpenModifyFreezerModal = (data) => {
    this.setState({ freezerId: data.freezer_id, freezerName: data.name, freezerType: data.type_id,
                    showModifyFreezerModal: true, freezerNameNull: false, freezerDepartmentNull: false,
                    freezerDepartmentId: data.department_id,
                    freezerTemperatureRuleId: data.rule_template_ids[0] || "",
                    enableDefrost: data.defrost ? (data.defrost.enable == "true") : (data.defrosting_enable == "true"),
                    freezerDeFrostMode: data.defrost ? data.defrost.mode : "regular",
                    freezerDeFrostPropertyId: "",
                    freezerBusinessTimePropertyId: "",
                    freezerDeFrostDuration: 40,
                    freezerDeFrostTimeHour: "08", freezerDeFrostTimeMin: "00", freezerDeFrostFrequencry: 4,
                    freezerDeFrostTimes_OtherFreq: [{Hour: "", Min: ""}],
                    freezerBusinessTimeFrom: -1, freezerBusinessTimeTo: -1 }, function() {
      this.getFreezerPropertyByFreezerId(data.freezer_id, this.getFreezerPropertyCallBackFunc);
    });
  }
  handleCloseModifyFreezerModal = () => {
    this.setState({ showModifyFreezerModal: false });
  }

  handleOpenConfirmModal = (data) => {
    this.setState({ showConfirmModal: true, confirmDeleteFreezerName: data.name, confirmDeleteFreezerId: data.freezer_id });
  }
  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false, confirmDeleteFreezerName: "", confirmDeleteFreezerId: "" });
  }

  handleOpenAlertModal = () => {
    this.setState({ showAlertModal: true });
  }
  handleCloseAlertModal = () => {
    this.setState({ showAlertModal: false });
  }

  handleEnableDefrost = (e) => {
    this.setState({ enableDefrost: !this.state.enableDefrost});
  }

  handleDefrostMode = (e) => {
    var freezerDeFrostMode = this.state.freezerDeFrostMode == "regular" ? "adv_alg_1" : "regular";
    this.setState({ freezerDeFrostMode: freezerDeFrostMode});
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

  handleDefrostTimeHourChange_OtherFreq = (e, i) => {
    if(this.state.freezerDeFrostTimes_OtherFreq.length > i) {
      var tmpDefrostTime = JSON.parse(JSON.stringify(this.state.freezerDeFrostTimes_OtherFreq));
      if(tmpDefrostTime[i]) {
        tmpDefrostTime[i].Hour = e.value;
        this.setState({ freezerDeFrostTimes_OtherFreq: tmpDefrostTime });
      }
    }
  }

  handleDefrostTimeMinChange_OtherFreq = (e, i) => {
    if(this.state.freezerDeFrostTimes_OtherFreq.length > i) {
      var tmpDefrostTime = JSON.parse(JSON.stringify(this.state.freezerDeFrostTimes_OtherFreq));
      tmpDefrostTime[i].Min = e.value;
      this.setState({ freezerDeFrostTimes_OtherFreq: tmpDefrostTime });
    }
  }

  addFreezerDefrostTime_OtherFreq = () => {
    var tmpDefrostTime = JSON.parse(JSON.stringify(this.state.freezerDeFrostTimes_OtherFreq));
    tmpDefrostTime.push({Hour: "", Min: ""});
    this.setState({ freezerDeFrostTimes_OtherFreq: tmpDefrostTime });
  }

  delFreezerDefrostTime_OtherFreq = () => {
    if(this.state.freezerDeFrostTimes_OtherFreq.length > 1) {
      var tmpDefrostTime = JSON.parse(JSON.stringify(this.state.freezerDeFrostTimes_OtherFreq));
      tmpDefrostTime.splice(-1, 1);
      this.setState({ freezerDeFrostTimes_OtherFreq: tmpDefrostTime });
    }
  }

  handleDefrostFrequencryChange = (e) => {
    this.setState({ freezerDeFrostFrequencry: e.value}, function() {
      this.handleDefrostTimeChange();
    });
  }

  handleDefrostDurationChange = (e) => {
    this.setState({ freezerDeFrostDuration: e.value}, function() {
      this.handleDefrostTimeChange();
    });
  }

  handleDefrostTimeChange = () => {
    if(this.state.freezerDeFrostTimeHour && this.state.freezerDeFrostTimeMin && this.state.freezerDeFrostDuration && this.state.freezerDeFrostFrequencry) {
      var timeFromTo = [], timeFrom = "", timeTo = "", frequencry = 24 / this.state.freezerDeFrostFrequencry;
      timeFrom = this.state.freezerDeFrostTimeHour + ":" + this.state.freezerDeFrostTimeMin;
      timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
      timeFromTo.push(timeFrom + " ~ " + timeTo);
      for(let i=1 ; i<this.state.freezerDeFrostFrequencry ; ++i) {
        timeFrom = moment(timeFrom, "HH:mm").add(frequencry, "H").format("HH:mm");
        timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
        timeFromTo.push(timeFrom + " ~ " + timeTo);
      }
      this.setState({ freezerDeFrostTimes: timeFromTo});
    }
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
      var frequencry = 24 / this.state.freezerDeFrostFrequencry;
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

  checkFreezerModalData = () => {
    if(this.state.freezerName == "" || this.state.freezerDepartmentId == "") {
      this.setState({freezerNameNull: this.state.freezerName == ""});
      this.setState({freezerDepartmentNull: this.state.freezerDepartmentId == ""});
      return false;
    }
    return true;
  }

  handleAddFreezer = () => {
    const {token} = this.props;
    if(this.checkFreezerModalData()) {
      var data = {
        name: this.state.freezerName,
        type_id: this.state.freezerType,
        branch_id: this.state.selectStoreID,
        department_id: this.state.freezerDepartmentId,
        rule_template_ids: this.state.freezerTemperatureRuleId == "" ? "" : [this.state.freezerTemperatureRuleId],
        defrosting_duration: this.state.freezerDeFrostDuration,
        defrosting_enable: this.state.enableDefrost,
        defrost_mode: this.state.freezerDeFrostMode,
        token: token
      };
      apiFreezerAdd(data)
      .then(function (response) {
        this.getFreezerDataByStore(this.state.selectStoreID);
        if (this.state.enableDefrost && response.data.freezer_id) {
          this.addFreezerPropertyAPI(response.data.freezer_id, "defrost_time");
        }
        if (this.state.freezerBusinessTimeFrom >= 0 && this.state.freezerBusinessTimeTo > this.state.freezerBusinessTimeFrom) {
          this.addFreezerPropertyAPI(response.data.freezer_id, "business_hour");
        }
        this.handleCloseAddFreezerModal();
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    }
  }

  handleUpdateFreezer = () => {
    const {token} = this.props;
    if(this.checkFreezerModalData()) {
      var data = {
        freezer_id: this.state.freezerId,
        name: this.state.freezerName,
        type_id: this.state.freezerType,
        branch_id: this.state.selectStoreID,
        department_id: this.state.freezerDepartmentId,
        rule_template_ids: this.state.freezerTemperatureRuleId == "" ? "" : [this.state.freezerTemperatureRuleId],
        defrosting_duration: this.state.freezerDeFrostDuration,
        defrosting_enable: this.state.enableDefrost,
        defrost_mode: this.state.freezerDeFrostMode,
        token: token
      };
      apiFreezerUpdate(data)
      .then(function (response) {
        this.getFreezerDataByStore(this.state.selectStoreID);
        if (this.state.enableDefrost) {
          if(this.state.freezerDeFrostPropertyId) {
            this.updateFreezerPropertyAPI("defrost_time");
          } else {
            this.addFreezerPropertyAPI(this.state.freezerId, "defrost_time");
          }
        } else if (this.state.freezerDeFrostPropertyId) {
          this.deleteFreezerPropertyAPI(this.state.freezerDeFrostPropertyId)
        }
        if (this.state.freezerBusinessTimeFrom >= 0 && this.state.freezerBusinessTimeTo > this.state.freezerBusinessTimeFrom) {
          this.updateFreezerPropertyAPI("business_hour");
        } else if (this.state.freezerBusinessTimePropertyId != "" && this.state.freezerBusinessTimeFrom == -1 && this.state.freezerBusinessTimeTo == -1) {
          this.deleteFreezerPropertyAPI(this.state.freezerBusinessTimePropertyId);
        }
        this.handleCloseModifyFreezerModal();
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    }
  }

  handleDeleteFreezer = () => {
    const {token} = this.props;
    var data = {
      freezer_id: this.state.confirmDeleteFreezerId,
      token: token
    };
    apiFreezerDelete(data)
    .then(function (response) {
      if(response.data.status == 0 && response.data.error_code == 7011) {
        this.handleOpenAlertModal();
      }
      this.getFreezerDataByStore(this.state.selectStoreID);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
    this.handleCloseConfirmModal();
  }

  updateFreezerPropertyAPI(type) {
    const {token} = this.props;
    if (type == "defrost_time") {
      var timeFromTo = this.getDefrostTimeFromTo();
      var data = {
        property_id: this.state.freezerDeFrostPropertyId,
        type: type,
        data: timeFromTo,
        token: token
      };
      apiFreezerPropertyUpdate(data)
      .then(function (response) {
        this.getFreezerPropertyByFreezerId(this.state.freezerId);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    } else if (type == "business_hour") {
      for(var i=0 ; i<=12 ; ++i) {
        var date = moment().add(i,'month').format('YYYY/MM/DD');
        this.checkFreezerProperty_BusinessTime(date);
      }
    }
  }

  checkFreezerProperty_BusinessTime(date) {
    const {token} = this.props;
    var tmpData = [];
    tmpData.push({index: 0, from_to:[this.state.freezerBusinessTimeFrom, this.state.freezerBusinessTimeTo]});
    var data = {
      freezer_id: this.state.freezerId,
      date: date,
      range: "mm",
      type: "business_hour",
      token: token
    };
    apiFreezerPropertyList(data)
    .then(function (response) {
      if(response.data.propertys.length > 0 && response.data.propertys[0].data.length > 0 && response.data.propertys[0].data[0].from_to.length > 1) {
        var data = {
          property_id: response.data.propertys[0].property_id,
          date: date,
          range: "mm",
          type: "business_hour",
          data: tmpData,
          token: token
        };
        apiFreezerPropertyUpdate(data)
        .then(function (response) {
          //console.log("apiFreezerPropertyUpdate response, ", response);
          //this.getFreezerPropertyByFreezerId(freezer_id);
        }.bind(this))
        .catch(function (error) {
          console.log(error);
        });
      } else {
        var data = {
          freezer_id: this.state.freezerId,
          date: date,
          range: "mm",
          type: "business_hour",
          data: tmpData,
          token: token
        };
        apiFreezerPropertyAdd(data)
        .then(function (response) {
          //console.log("apiFreezerPropertyAdd response, ", response);
          //this.getFreezerPropertyByFreezerId(freezer_id);
        }.bind(this))
        .catch(function (error) {
          console.log(error);
        });
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  deleteFreezerPropertyAPI(property_id) {
    const {token} = this.props;
    var data = {
      property_id: property_id,
      token: token
    };
    apiFreezerPropertyDelete(data)
    .then(function (response) {
      this.getFreezerPropertyByFreezerId(this.state.freezerId);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  addFreezerPropertyAPI = (freezer_id, type) => {
    const {token} = this.props;
    if (type == "defrost_time") {
      var timeFromTo = this.getDefrostTimeFromTo();
      var data = {
        freezer_id: freezer_id,
        type: type,
        data: timeFromTo,
        token: token
      };
      apiFreezerPropertyAdd(data)
      .then(function (response) {
        this.getFreezerPropertyByFreezerId(freezer_id);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    } else if (type == "business_hour") {
      var tmpData = [];
      tmpData.push({index: 0, from_to:[this.state.freezerBusinessTimeFrom, this.state.freezerBusinessTimeTo]});
      for(var i=0 ; i<=12 ; ++i) {
        var data = {
          freezer_id: freezer_id,
          date: moment().add(i,'month').format('YYYY/MM/DD'),
          range: "mm",
          type: type,
          data: tmpData,
          token: token
        };
        apiFreezerPropertyAdd(data)
        .then(function (response) {
          //console.log("addFreezerPropertyAPI response, ", response);
          //this.getFreezerPropertyByFreezerId(freezer_id);
        }.bind(this))
        .catch(function (error) {
          console.log(error);
        });
      }
    }
  }

  renderAddFreezerModal() {
    return (
      <SettingTemplateDialog
         isOpen={this.state.showAddFreezerModal}
         modalTitle={Locales.freezer.新增冷凍櫃}
         cancelCB={this.handleCloseAddFreezerModal}
         confirmCB={this.handleAddFreezer}
         width={"600px"}
         shouldCloseOnOverlayClick={true} >
         { this.renderFreezerModal() }
      </SettingTemplateDialog>
    );
  }

  renderModifyFreezerModal() {
    return (
      <SettingTemplateDialog
         isOpen={this.state.showModifyFreezerModal}
         modalTitle={Locales.freezer.修改冷凍櫃}
         cancelCB={this.handleCloseModifyFreezerModal}
         confirmCB={this.handleUpdateFreezer}
         width={"600px"}
         shouldCloseOnOverlayClick={true} >
         { this.renderFreezerModal() }
      </SettingTemplateDialog>
    );
  }

  renderFreezerModal() {
    const { storeDepartment }=this.props;
    var storeDepartments = [];
    for(var i=0 ; i<storeDepartment.length ; ++i) {
      storeDepartments.push({value: storeDepartment[i].id, label: storeDepartment[i].name});
    }
    const freezerTypeOptions = [
      {value: "", label: "　"},
      {value: "normal", label: Locales.freezer.一般},
      {value: "table", label: Locales.freezer.冰台}
    ];
    var tempRuleOptions = [{value: "", label: "　"}];
    for(var i=0 ; i<this.state.temperatureRuleList.length ; ++i) {
      tempRuleOptions.push({value: this.state.temperatureRuleList[i].rule_template_id, label: this.state.temperatureRuleList[i].name});
    }
    //console.log("tempRuleOptions, ", tempRuleOptions);
    const deFrostDurationOptions = [];
    for(let i=10 ; i<=180 ; i+=10) {
      deFrostDurationOptions.push({value: i, label: i + " " + Locales.common.分鐘});
    }
    const deFrostFrequencryOptions = [
      {value: "1", label: "1天1次"},{value: "2", label: "1天2次"},
      {value: "3", label: "1天3次"},{value: "4", label: "1天4次"},
      {value: "5", label: "1天5次"},{value: "6", label: "1天6次"},
      {value: "7", label: "1天7次"},{value: "8", label: "1天8次"},
      {value: "9", label: "1天9次"},{value: "10", label: "1天10次"},
      {value: "11", label: "1天11次"},{value: "12", label: "1天12次"},
      {value: "other", label: "自訂"}
    ];
    var timeHourOptions = [], timeMinOptions = [];
    for(var i=0 ; i<24 ; ++i) {
      timeHourOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    for(var i=0 ; i<60 ; ++i) {
      timeMinOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    var timeHourForBusinessOptions = [{value: -1, label: "　"}];
    for(var i=0 ; i<=24 ; ++i) {
      timeHourForBusinessOptions.push({value: i, label: padLeft(i.toString(),2) + ":00"})
    }
    var defrostSettingEnable = this.state.enableDefrost && this.state.freezerDeFrostMode != "adv_alg_1";
    return (
      <table width="97%" className="CorrectSubpageTable">
        <tbody>
          <tr>
            <td width="30%">{Locales.freezer.冷凍櫃名稱}<label className="required">*</label></td>
            <td><input type="text" className="InputStyle" style={this.state.freezerNameNull ? {borderColor: "red"} : {}} value={this.state.freezerName} onChange={e=>this.setState({freezerName: e.target.value})}></input></td>
          </tr>
          <tr>
            <td>{Locales.freezer.類型}</td>
            <td>
              <Select
                options={freezerTypeOptions}
                placeholder={Locales.common.請選擇}
                value={freezerTypeOptions.filter(option=>option.value==this.state.freezerType)}
                onChange={e=>this.setState({freezerType: e.value})}
              />
            </td>
          </tr>
          <tr>
            <td>{Locales.freezer.部門}<label className="required">*</label></td>
            <td>
              <Select
                options={storeDepartments}
                className={this.state.freezerDepartmentNull ? "error" : ""}
                placeholder={Locales.common.請選擇}
                value={storeDepartments.filter(option=>option.value==this.state.freezerDepartmentId)}
                onChange={e=>this.setState({freezerDepartmentId: e.value})}
              />
            </td>
          </tr>
          <tr>
            <td>{Locales.freezer.溫度標準}</td>
            <td>
              <Select
                options={tempRuleOptions}
                placeholder={Locales.common.請選擇}
                value={tempRuleOptions.filter(option=>option.value==this.state.freezerTemperatureRuleId)}
                onChange={e=>this.setState({freezerTemperatureRuleId: e.value})}
              />
            </td>
          </tr>
          <tr>
            <td>{Locales.freezer.運作時間}</td>
            <td>
              <div style={{width: "150px", display: "inline-block"}}>
                <Select
                  options={timeHourForBusinessOptions}
                  placeholder={""}
                  value={timeHourForBusinessOptions.filter(option=>option.value==this.state.freezerBusinessTimeFrom)}
                  onChange={e=>this.setState({freezerBusinessTimeFrom: e.value})}
                />
              </div>
              <span> ~ </span>
              <div style={{width: "150px", display: "inline-block"}}>
                <Select
                  options={timeHourForBusinessOptions}
                  placeholder={""}
                  value={timeHourForBusinessOptions.filter(option=>option.value==this.state.freezerBusinessTimeTo)}
                  onChange={e=>this.setState({freezerBusinessTimeTo: e.value})}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan="2">
              <input type="checkbox" checked={this.state.enableDefrost} onChange={this.handleEnableDefrost}/>
              <span style={{marginLeft: "20px", cursor: "pointer"}} onClick={this.handleEnableDefrost}>{Locales.freezer.啟用除霜}</span>
            </td>
          </tr>
        </tbody>
        <tbody style={this.state.enableDefrost ? {} : {color: "#cccccc"}}>
          <tr>
            <td colSpan="2">
              <input type="checkbox" checked={this.state.freezerDeFrostMode == "adv_alg_1"} onChange={this.handleDefrostMode} disabled={!this.state.enableDefrost}/>
              <span style={{marginLeft: "20px", cursor: "pointer"}} onClick={this.handleDefrostMode}>{Locales.freezer.系統自動偵測}</span>
            </td>
          </tr>
        </tbody>
        <tbody style={defrostSettingEnable ? {} : {color: "#cccccc"}}>
          <tr style={this.state.freezerDeFrostFrequencry == "other" ? {display: "none"} : {}}>
            <td>{Locales.freezer.任一除霜時間}</td>
            <td>
              <div style={{width: "80px", display: "inline-block"}}>
                <Select
                  options={timeHourOptions}
                  placeholder={""}
                  isDisabled={!defrostSettingEnable}
                  value={timeHourOptions.filter(option=>option.value==this.state.freezerDeFrostTimeHour)}
                  onChange={this.handleDefrostTimeHourChange}
                />
              </div>
              <span> : </span>
              <div style={{width: "80px", display: "inline-block"}}>
                <Select
                  options={timeMinOptions}
                  placeholder={""}
                  isDisabled={!defrostSettingEnable}
                  value={timeMinOptions.filter(option=>option.value==this.state.freezerDeFrostTimeMin)}
                  onChange={this.handleDefrostTimeMinChange}
                />
              </div>
            </td>
          </tr>
          <tr style={this.state.freezerDeFrostFrequencry != "other" ? {display: "none"} : {}}>
            <td>{Locales.freezer.除霜時間}</td>
            <td>
              <div style={{width: "80px", display: "inline-block"}}>
                <Select
                  options={timeHourOptions}
                  placeholder={""}
                  isDisabled={!defrostSettingEnable}
                  value={timeHourOptions.filter(option=>option.value==this.state.freezerDeFrostTimes_OtherFreq[0].Hour)}
                  onChange={(e)=>this.handleDefrostTimeHourChange_OtherFreq(e,0)}
                />
              </div>
              <span> : </span>
              <div style={{width: "80px", display: "inline-block"}}>
                <Select
                  options={timeMinOptions}
                  placeholder={""}
                  isDisabled={!defrostSettingEnable}
                  value={timeMinOptions.filter(option=>option.value==this.state.freezerDeFrostTimes_OtherFreq[0].Min)}
                  onChange={(e)=>this.handleDefrostTimeMinChange_OtherFreq(e,0)}
                />
              </div>
              <Button style={{margin: "0 0 4px 30px", fontSize: "18px"}} onClick={this.addFreezerDefrostTime_OtherFreq}>
                {Locales.common.新增}
              </Button>
              <Button style={{margin: "0 0 4px 20px", fontSize: "18px"}} onClick={this.delFreezerDefrostTime_OtherFreq}>
                {Locales.common.刪除}
              </Button>
            </td>
          </tr>
          <tr style={this.state.freezerDeFrostFrequencry == "other" && this.state.freezerDeFrostTimes_OtherFreq.length > 1 ? {} : {display: "none"}}>
            <td colSpan={2} style={{textAlign: "center"}}>
              <Row>
                { this.renderFreezerDeFrost() }
              </Row>
            </td>
          </tr>
          <tr>
            <td>{Locales.freezer.除霜頻率}</td>
            <td>
              <Select
                options={deFrostFrequencryOptions}
                maxMenuHeight={210}
                placeholder={""}
                isDisabled={!defrostSettingEnable}
                value={deFrostFrequencryOptions.filter(option=>option.value==this.state.freezerDeFrostFrequencry)}
                onChange={this.handleDefrostFrequencryChange}
                maxMenuHeight={200}
              />
            </td>
          </tr>
          <tr>
            <td>{Locales.freezer.除霜持續時間}</td>
            <td>
              <Select
                options={deFrostDurationOptions}
                maxMenuHeight={210}
                placeholder={""}
                isDisabled={!defrostSettingEnable}
                value={deFrostDurationOptions.filter(option=>option.value==this.state.freezerDeFrostDuration)}
                onChange={this.handleDefrostDurationChange}
                maxMenuHeight={200}
              />
            </td>
          </tr>
          <tr>
            <td colSpan="2">
              <Row>
                { this.renderDeFrostTimes() }
              </Row>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderFreezerDeFrost() {
    var timeHourOptions = [], timeMinOptions = [];
    for(var i=0 ; i<24 ; ++i) {
      timeHourOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    for(var i=0 ; i<60 ; ++i) {
      timeMinOptions.push({value: padLeft(i.toString(),2), label: padLeft(i.toString(),2)})
    }
    var index = -1;
    return _.map(this.state.freezerDeFrostTimes_OtherFreq, time => {
      ++index;
      if(index > 0 && this.state.freezerDeFrostTimes_OtherFreq[index] != null) {
        let indexTmp = index;
        return (
          <Col key={Math.random()} md={6} style={{paddingBottom: "5px"}}>
            <div style={{width: "80px", display: "inline-block"}}>
              <Select
                options={timeHourOptions}
                placeholder={""}
                isDisabled={this.state.enableDefrost ? false : true}
                value={timeHourOptions.filter(option=>option.value==this.state.freezerDeFrostTimes_OtherFreq[indexTmp].Hour)}
                onChange={(e)=>this.handleDefrostTimeHourChange_OtherFreq(e,indexTmp)}
              />
            </div>
            <span> : </span>
            <div style={{width: "80px", display: "inline-block"}}>
              <Select
                options={timeMinOptions}
                placeholder={""}
                isDisabled={this.state.enableDefrost ? false : true}
                value={timeMinOptions.filter(option=>option.value==this.state.freezerDeFrostTimes_OtherFreq[indexTmp].Min)}
                onChange={(e)=>this.handleDefrostTimeMinChange_OtherFreq(e,indexTmp)}
              />
            </div>
          </Col>
        )
      }
    });
  }

  renderDeFrostTimes() {
    if(this.state.freezerDeFrostFrequencry != "other") {
      return _.map(this.state.freezerDeFrostTimes, time => {
        return (
          <Col key={Math.random()} md={4} style={{textAlign: "center"}}>
            <span>{time}</span>
          </Col>
        )
      });
    } else {
      return _.map(this.state.freezerDeFrostTimes_OtherFreq, time => {
        if(time.Hour != "" && time.Min != "") {
          var timeFrom = "", timeTo = "";
          timeFrom = time.Hour + ":" + time.Min;
          timeTo = moment(timeFrom, "HH:mm").add(this.state.freezerDeFrostDuration, "m").format("HH:mm");
          return (
            <Col key={Math.random()} md={4} style={{textAlign: "center"}}>
              <span>{timeFrom + " ~ " + timeTo}</span>
            </Col>
          )
        }
      });
    }
  }

  getDepartmentName(id) {
    const { storeDepartment }=this.props;
    var name = id;
    for(var i=0 ; i<storeDepartment.length ; ++i) {
      if(storeDepartment[i].id == id) {
        name = storeDepartment[i].name;
      }
    }
    return name;
  }

  getFreezerType(type) {
    var name = "";
    if (type == "normal") {
      name = Locales.freezer.一般;
    } else if (type == "table") {
      name = Locales.freezer.冰台;
    }
    return name;
  }

  getTemperatureRuleName(ids) {
    for(var i=0 ; i<ids.length ; ++i) {
      for(var j=0 ; j<this.state.temperatureRuleList.length ; ++j) {
        if(ids[i] == this.state.temperatureRuleList[j].rule_template_id) {
          return this.state.temperatureRuleList[j].name;
        }
      }
    }
    return "";
  }

  renderConfirmDeleteFreezerModal() {
    if(this.state.showConfirmModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.common.您確定刪除嗎.format( this.state.confirmDeleteFreezerName )}
            confirmCB={this.handleDeleteFreezer}
            cancelCB={this.handleCloseConfirmModal}
          />
        </div>
      );
    }
  }

  renderAlertDeleteFreezerModal() {
    if(this.state.showAlertModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <AlertDialog
            content={Locales.common.此狀態下無法刪除}
            confirmCB={this.handleCloseAlertModal}
          />
        </div>
      );
    }
  }

  buttonFormatter = (cell, row) => {
    return (
      <div>
        <Button style={{marginRight: "10px"}} onClick={() => this.handleOpenModifyFreezerModal(row)}>{Locales.common.修改}</Button>
        <Button onClick={() => this.handleOpenConfirmModal(row)} bsClass="btn btn-danger">{Locales.common.刪除}</Button>
      </div>
    );
  };

  render() {
    const { storeDepartment }=this.props;
    const { freezerList,temperatureRuleList }=this.state;
    var height = (window.innerHeight - 200) + "px";
    const depList = storeDepartment.length > 0 ? storeDepartment.map(function(d){
      return { value: d.id, label: d.name}
    }):[];
    const ruleTemplateList = temperatureRuleList.length > 0 ? temperatureRuleList.map(function(d){
      return { value: d.rule_template_id, label: d.name}
    }):[];
    const statusList = [
      { value: 1, label: Locales.freezerStatus.Idle },
      { value: 3, label: Locales.freezerStatus.Malfunction },
      /*{ value: 4, label: Locales.freezerStatus.已刪除 },*/
      { value: 11, label:Locales.freezerStatus.Online },
      { value: 12, label:Locales.freezerStatus.Abnormal },
      { value: 14, label: Locales.freezerStatus.Pause },
      { value: 16, label:Locales.freezerStatus.Standby },
      { value: 17, label:Locales.freezerStatus.Initial }
    ];
    const typeList = [
      { value: "normal", label: Locales.freezer.一般 },
      { value: "table", label: Locales.freezer.冰台 },
    ];
    const set = new Set();
    const regionList = this.props.store.length? this.props.store.filter(item =>
      !set.has(item.region_id)
        ? set.add(item.region_id)
        : false
    ):[];
    let regionNameListOptions =  regionList.map(function(x, i) {
      return { value: x.region_id, label: x.region_name };
    });
    if(regionNameListOptions.length == 0){
      regionNameListOptions = [{ value: 0, label: ""}]
    }
    let  viewWidth = window.innerWidth - 370;
    const columns = [
      {
        dataField: "status",
        text: Locales.freezer.狀態,
        sort: true,
        formatter: cell => statusList.find(opt => opt.value == cell)
        ? statusList.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  statusList
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`
        }
      },
      {
        dataField: "name",
        text: Locales.freezer.冷凍櫃名稱,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "type_id",
        text: Locales.freezer.類型,
        sort: true,
        formatter: cell => typeList.find(opt => opt.value == cell)
        ? typeList.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  typeList
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`
        }
      },
      {
        dataField: "department_id",
        text: Locales.freezer.部門,
        sort: true,
        formatter: cell => depList.find(opt => opt.value == cell)
        ? depList.find(opt => opt.value == cell).label
        : "",
        filter: selectFilter({
          options:  depList
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`
        }
      },
      {
        dataField: "rule_template_ids[0]",
        text: Locales.freezer.溫度標準,
        sort: true,
        formatter: cell => ruleTemplateList.find(opt => opt.value == cell)
        ? ruleTemplateList.find(opt => opt.value == cell).label
        : "",
        filter: temperatureRuleList.length > 0 ? selectFilter({
          options:  ruleTemplateList
        }) : null,
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
          wordWrap: "break-word"
        }
      },
      /*{
        dataField: "deFrostTime",
        text: Locales.freezer.除霜設定,
        formatter:this.defrostFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
        }
      },*/
      {
        dataField: "",
        text: "",
        formatter:this.buttonFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100+25}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          textAlign:"center"
        }
      }
    ];
    const defaultSorted =[{
      dataField: 'name', // if dataField is not match to any column you defined, it will be ignored.
      order: 'asc' // desc or asc
    }];
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
        <div className="Subpage">
          <div className="WhiteBGSubpage">
            <Button onClick={this.handleOpenAddFreezerModal}>{Locales.freezer.新增冷凍櫃}</Button>
            { this.renderAddFreezerModal() }
            { this.renderModifyFreezerModal() }
            { this.renderConfirmDeleteFreezerModal() }
            { this.renderAlertDeleteFreezerModal() }
            <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
              <CompTable
                keyField="freezer_id"
                data={freezerList}
                columns={columns}
                defaultSorted={defaultSorted}
              />
            </div>
          </div>
        </div>
      </BlockUi>
    );
  }
}

function mapStateToProps({ store, storeDepartment, token, user }, ownProps) {
  return { store, storeDepartment, token, user };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(FreezerSubpage);
