import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { apiDataRetrieve, apiAlertRecordList, apiAlertRecordInfo, apiFreezerList,
         apiSensorList, toCancelApi, apiSensorCalibrationListBySensors,
         apiFreezerHistory, apiFreezerPropertyHistory, apiGetReportList, apiDataTransaction, apiScheduleList } from "../utils/api";
import { sortByKey, parseStoreType } from "../utils/common"
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { Container, Row, Col } from 'reactstrap';
import Select from 'react-select';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import $ from 'jquery';
import Modal from 'react-modal';
import {Locales} from '../lang/language';
Modal.setAppElement(document.querySelector(".container"));
import BlockUi from 'react-block-ui';

const WeekList = [
  { value: "1", label: Locales.weekList.星期一 },
  { value: "2", label: Locales.weekList.星期二 },
  { value: "3", label: Locales.weekList.星期三 },
  { value: "4", label: Locales.weekList.星期四 },
  { value: "5", label: Locales.weekList.星期五 },
  { value: "6", label: Locales.weekList.星期六 },
  { value: "7", label: Locales.weekList.星期日 }
];

const customStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '10%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    width: '70%',
    transform : 'translate(-50%, 0)',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};

class ReportSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      multiBranchExport_Total: 0,
      multiBranchExport_Now: 0,
      showStoreModal: false,
      selectStoreModalType: "",
      from: new Date(moment().subtract(6, 'day').format("YYYY/MM/DD")),
      to: new Date(moment().format("YYYY/MM/DD")),
      ExportDataByTypeStores: [],
      ExportDataByTypeStore: {},
      ExportDataByMonthStore: {},
      reportType: "",
      reportMonth: ""
    };
  }
  componentWillUnmount(){
    toCancelApi();
  }

  handleOpenStoreModalByType = () => {
    this.setState({ showStoreModal: true, selectStoreModalType: "type" });
  }
  handleOpenStoreModalByMonth = () => {
    this.setState({ showStoreModal: true, selectStoreModalType: "month" });
  }
  handleCloseStoreModal = () => {
    this.setState({ showStoreModal: false });
  }

  showFromMonth() {
    const { from, to } = this.state;
    if (!from) {
      return;
    }
    if (moment(to).diff(moment(from), 'months') < 2) {
      this.to.getDayPicker().showMonth(from);
    }
  }
  handleFromChange = (from) => {
    // Change the from date and focus the "to" input field
    this.setState({ from });
  }
  handleToChange = (to) => {
    this.setState({ to }, this.showFromMonth);
  }

  handleExportReportByType = async () => {
    if (this.state.ExportDataByTypeStores.length == 0) {
      alert(Locales.common.請選擇位置);
      return;
    }
    if (this.state.reportType == "") {
      alert(Locales.common.請選擇報表類型);
      return;
    }
    if (moment(this.state.to).diff(moment(this.state.from), 'months') > 2
        && this.state.reportType != "battery" && this.state.reportType != "correction") {
      alert(Locales.common.日期區間不能大於3個月);
      return;
    }
    this.setState({
      multiBranchExport_Total: this.state.ExportDataByTypeStores.length,
      multiBranchExport_Now: 0
    });
    for(let i=0 ; i<this.state.ExportDataByTypeStores.length ; ++i) {
      //console.log("export data branch, ", this.state.ExportDataByTypeStores[i].branch_name);
      await this.doExportDataByType(this.state.ExportDataByTypeStores[i]);
      this.setState({multiBranchExport_Now: this.state.multiBranchExport_Now+1});
    }
  }

  doExportDataByType = async(store) => {
    await this.setState({ExportDataByTypeStore: store});
    switch(this.state.reportType) {
      case "inspect":
      case "receipt":
      case "transport":
      case "temp_statistic":
        await this.reportByDataRetrieve();
      break;
      case "temperature":
        await this.reportByAlertRecord();
      break;
      case "battery":
        await this.reportBySensorList();
      break;
      case "correction":
        await this.reportCalibrationList();
      break;
      case "pause":
      case "freezer":
        await this.reportFreezerHistory();
      break;
    }
  }

  async reportByDataRetrieve() {
    const {token} = this.props;
    let data = {
      type: this.state.reportType,
      targetId: this.state.ExportDataByTypeStore.branch_id,
      startTime: moment(this.state.from).format("YYYY-MM-DD 00:00:00"),
      endTime: moment(this.state.to).format("YYYY-MM-DD 23:59:59"),
      token: token
    }
    this.setState({blocking: true});
    await apiDataRetrieve(data)
    .then(async function (response) {
      if (response.data.status == 1) {
        //console.log("response.data.transaction_datas, ", response.data.transaction_datas);
        if (this.state.reportType == "inspect") {
          await this.handleParseData_Inspect(response.data.transaction_datas);
        } else if (this.state.reportType == "receipt") {
          await this.handleParseData_Receipt(response.data.transaction_datas);
        } else if (this.state.reportType == "transport") {
          for(var i=0 ; i<response.data.transaction_datas.length ; ++i) {
            let record = await this.doGetTransactionData(response.data.transaction_datas[i].id);
            response.data.transaction_datas[i].sensorData = record;
          }
          await this.handleParseData_Transport(response.data.transaction_datas);
        } else if (this.state.reportType == "temp_statistic") {
          await this.handleParseData_TempStatistic(response.data.freezers);
        }
      } else {
        console.log("apiDataRetrieve error : ", response.data);
      }
      this.setState({blocking: false});
    }.bind(this))
    .catch(function (error) {
      console.log("apiDataRetrieve error : ", error);
      this.setState({blocking: false});
    }.bind(this));
  }

  doGetTransactionData = async (id) => {
    const {token} = this.props;
    let reqData = {transactionId: id, token: token}
    let response = await apiDataTransaction(reqData);
    //console.log("doGetTransactionData response:",response);
    if(response.data.status == 1 && response.data.content.sensors[0]){
      return response.data.content.sensors[0].sensor_datas;
    } else {
      return null;
    }
  }

  async reportByAlertRecord() {
    const {token} = this.props;
    let data = {
      monitor_item: this.state.reportType,
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      period: [ moment(this.state.from).format("YYYY-MM-DD 00:00:00"),
                moment(this.state.to).format("YYYY-MM-DD 23:59:59")],
      token: token
    }
    //console.log("reportByAlertRecord data, ", data);
    this.setState({blocking: true});
    await apiAlertRecordList(data)
    .then(async function (response) {
      if (response.data.status == 1) {
        if (this.state.reportType == "temperature") {
          let records = [], count = 0, recordsArray = [], tmpArray = [];
          for(var i=0 ; i<response.data.alert_triggers.length ; ++i) {
            if(count <= 20) {
              count++;
              tmpArray.push(response.data.alert_triggers[i]);
            } else {
              count = 1;
              recordsArray.push(tmpArray);
              tmpArray = [];
              tmpArray.push(response.data.alert_triggers[i]);
            }
          }
          if(count > 0) { recordsArray.push(tmpArray); }
          for(var i=0 ; i<recordsArray.length ; ++i) {
            await Promise.all(_.map(recordsArray[i], async alert=>{
              //console.log("alert, ", alert);
              if(alert.target_type == "freezer") {
                let record = await this.doGetAlertRecordInfo(alert.alert_id);
                let cause = "", conclusion = "", causeTime = "", conclusionTime = "", handlingTime = "";
                //console.log("record, ", record);
                _.map(record,rec => {
                  if (rec.content_type=="cause") {
                    cause = rec.content;
                    if(causeTime == "") { causeTime = rec.timestamp; }
                  }
                  if (rec.content_type=="conclusion") {
                    conclusion = rec.content;
                    if(conclusionTime == "") { conclusionTime = rec.timestamp; }
                  }
                });
                if(causeTime != "" && conclusionTime != "") {
                  handlingTime = moment(moment.duration(moment(conclusionTime).diff(moment(causeTime)))._data).format("HH:mm:ss");
                }
                alert.cause = cause;
                alert.conclusion = conclusion;
                alert.causeTime = causeTime;
                alert.conclusionTime = conclusionTime;
                alert.handlingTime = handlingTime;
                records.push(alert);
              }
            }));
          }
          //console.log("records, ", records);
          await this.handleParseData_Temperature(records);
        } else if (this.state.reportType == "battery") {
          await this.handleParseData_BatteryAlert(response.data.alert_triggers);
        }
      } else {
        console.log("apiAlertRecordList error : ", response.data);
      }
      this.setState({blocking: false});
    }.bind(this))
    .catch(function (error) {
      console.log("apiAlertRecordList error : ", error);
      this.setState({blocking: false});
    }.bind(this));
  }

  doGetAlertRecordInfo = async (alertId) => {
    const {token} = this.props;
    let reqData = {alert_id: alertId, token: token}
    let response = await apiAlertRecordInfo(reqData);
    let record = [];
    if(response.data.status == 1){
      let respData = response.data.alert_records;
      for(let i=0; i <respData.length;i++){
        record.push(respData[i].record);
      }
      sortByKey(record,"timestamp",true);
    } else {
      console.log("doGetAlertRecordInfo response:",response);
    }
    return record;
  }

  async handleParseData_Inspect(sourceData) {
    const {token} = this.props;
    var data = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    await apiFreezerList(data)
    .then(async function (response) {
      let freezerMap = [];
      for(let i=0 ; i<response.data.freezers.length ; ++i) {
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }

      await apiScheduleList(data)
      .then(async function(response) {
        let result = [];
        if(response.data.branch_tasks && response.data.branch_tasks.length > 0){
          response.data.branch_tasks.forEach(t => {
            result = result.concat(t.tasks);
          });
        }
        //console.log("scheduleList : ", result);
        let exportData = "巡檢排程"+"\r\n";
        exportData += "狀態,冷凍(藏)櫃,執行日期區間,頻率(天),時段"+"\r\n";
        for(let i=0 ; i<result.length ; ++i) {
          let weekLabel = "";
          if (result[i].schedule.index.length === 7) {
            weekLabel = Locales.watch.每天;
          } else {
            let weekDatas = WeekList.filter(
              x => result[i].schedule.index.indexOf(parseInt(x.value)) > -1
            );
            if (weekDatas.length > 0) {
              weekLabel = "\"" + weekDatas.map(w => w.label).join(",") + "\"";
            }
          }
          let dateLabel;
          if (result[i].schedule.start_date && result[i].schedule.end_date) {
            dateLabel = moment(result[i].schedule.start_date).format("YYYY/MM/DD") + " ~ " + moment(result[i].schedule.end_date).format("YYYY/MM/DD");
          } else if (result[i].schedule.start_date) {
            dateLabel = Locales.watch.起.format(moment(result[i].schedule.start_date).format("YYYY/MM/DD"));
          } else if (result[i].schedule.end_date) {
            dateLabel = Locales.watch.止.format(moment(result[i].schedule.end_date).format("YYYY/MM/DD"));
          } else {
            dateLabel = Locales.common.不限;
          }
          exportData += (result[i].enabled ? Locales.watch.啟用 : Locales.watch.停用) + ",";
          exportData += freezerMap[result[i].freezer_id] + ",";
          exportData += dateLabel + ",";
          exportData += weekLabel + ",";
          exportData += result[i].schedule.time + "\r\n";
        }
        exportData += "\r\n";

        exportData += "門市型態,區域,門市名稱,門市代碼,巡檢對象,巡檢時間,巡檢品項,溫度,結果"+"\r\n";
        for(let i=0 ; i<sourceData.length ; ++i) {
          exportData += this.state.ExportDataByTypeStore.type_name + ",";
          exportData += this.state.ExportDataByTypeStore.region_name + ",";
          exportData += this.state.ExportDataByTypeStore.branch_name + ",";
          exportData += this.state.ExportDataByTypeStore.branch_code + ",";
          exportData += freezerMap[sourceData[i].content.freezer_id] + ",";
          exportData += sourceData[i].timestamp + ",";
          exportData += sourceData[i].content.product.name.replace(/\n/g," ") + ",";
          exportData += sourceData[i].content.product.temperature + "°C,";
          exportData += (sourceData[i].content.result ? "合格" : "不合格") + "\r\n";
        }
        this.handleExportReport(exportData);
      }.bind(this))
      .catch(function(error) {
        console.log(error);
      });
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleParseData_Receipt(sourceData) {
    let exportData = "門市型態,區域,門市名稱,門市代碼,收貨時間,廠商名稱,廠商編號,產品名稱,品溫,結果,車溫,運輸車清潔情況"+"\r\n";
    for(let i=0 ; i<sourceData.length ; ++i) {
      exportData += this.state.ExportDataByTypeStore.type_name + ",";
      exportData += this.state.ExportDataByTypeStore.region_name + ",";
      exportData += this.state.ExportDataByTypeStore.branch_name + ",";
      exportData += this.state.ExportDataByTypeStore.branch_code + ",";
      exportData += sourceData[i].timestamp + ",";
      exportData += sourceData[i].content.vendor.name + ",";
      exportData += sourceData[i].content.vendor.code.replace(/\n/g," ") + ",";
      exportData += sourceData[i].content.product.name.replace(/\n/g," ") + ",";
      exportData += sourceData[i].content.product.temperature + "°C,";
      exportData += (sourceData[i].content.result ? "合格" : "不合格") + ",";
      exportData += sourceData[i].content.transport.temperature + "°C,";
      exportData += sourceData[i].content.transport.clean.name + "\r\n";
    }
    this.handleExportReport(exportData);
  }

  handleParseData_Transport(sourceData) {
    //console.log("handleParseData_Transport sourceData, ", sourceData);
    const {store} = this.props;
    var branchMap = [];
    for(let i=0 ; i<store.length ; ++i) {
      branchMap[store[i].branch_id] = store[i];
    }
    let exportData = "到店門市型態,到店門市區域,到店門市名稱,到店門市代碼,發車單位,發車時間,到店時間,運輸時間,上傳時間,廠商編號,廠商名稱,結果,溫度合格率,第一筆溫度時間,最後一筆溫度時間,溫度紀錄"+"\r\n";
    for(let i=0 ; i<sourceData.length ; ++i) {
      let firstDataTime = "", lastDataTime = "", datalist = "\"";
      if(sourceData[i].sensorData && sourceData[i].content.standard && sourceData[i].content.standard.temperature) {
        for(var j=0 ; j<sourceData[i].sensorData.length ; ++j) {
          if(j==0) {
            firstDataTime = moment(sourceData[i].sensorData[j].timestamp*1000).utc().format("YYYY/MM/DD HH:mm");
            datalist += sourceData[i].sensorData[j].value.temperature;
          } else {
            datalist += "," + sourceData[i].sensorData[j].value.temperature;
          }
          if(j==sourceData[i].sensorData.length-1) {
            lastDataTime = moment(sourceData[i].sensorData[j].timestamp*1000).utc().format("YYYY/MM/DD HH:mm");
          }
        }
      }
      datalist += "\"";
      let arrival_branch = branchMap[sourceData[i].content.arrival_branch.id] || {};
      let transport_time = moment(moment.duration(moment(sourceData[i].content.arrival_time).diff(moment(sourceData[i].content.departure_time)))._data).format("HH:mm:ss");
      exportData += arrival_branch.type_name + ",";
      exportData += arrival_branch.region_name + ",";
      exportData += sourceData[i].content.arrival_branch.name + ",";
      exportData += arrival_branch.branch_code + ",";
      exportData += sourceData[i].content.departure_branch.name.replace(/\n/g," ") + ",";
      exportData += sourceData[i].content.departure_time + ",";
      exportData += sourceData[i].content.arrival_time + ",";
      exportData += transport_time + ",";
      exportData += sourceData[i].timestamp + ",";
      exportData += sourceData[i].content.vendor.code.replace(/\n/g," ") + ",";
      exportData += sourceData[i].content.vendor.name + ",";
      exportData += (sourceData[i].content.result ? "合格" : "不合格") + ",";
      exportData += sourceData[i].content.yield + "%" + ",";
      exportData += firstDataTime + ",";
      exportData += lastDataTime + ",";
      exportData += datalist + "\r\n";
    }
    this.handleExportReport(exportData);
  }

  async handleParseData_TempStatistic(sourceData) {
    const {token} = this.props;
    var data = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    await apiFreezerList(data)
    .then(async function (response) {
      let freezerMap = [];
      for(var i=0 ; i<response.data.freezers.length ; ++i) {
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }
      let exportData = "門市型態,區域,門市名稱,門市代碼,冰箱名稱,原始溫度異常比率,原始溫度正常比率,原始未受監控比率,溫度異常比率,溫度正常比率,溫度異常筆數,溫度正常筆數,未受監控筆數"+"\r\n";
      for(let i=0 ; i<sourceData.length ; ++i) {
        let total = sourceData[i].temp_count.abnormal + sourceData[i].temp_count.normal + sourceData[i].temp_count.unknown;
        let total_withoutUnknown = sourceData[i].temp_count.abnormal + sourceData[i].temp_count.normal;
        exportData += this.state.ExportDataByTypeStore.type_name + ",";
        exportData += this.state.ExportDataByTypeStore.region_name + ",";
        exportData += this.state.ExportDataByTypeStore.branch_name + ",";
        exportData += this.state.ExportDataByTypeStore.branch_code + ",";
        exportData += freezerMap[sourceData[i].freezer_id] + ",";
        exportData += (sourceData[i].temp_count.abnormal / total * 100) + "%" + ",";
        exportData += (sourceData[i].temp_count.normal / total * 100) + "%" + ",";
        exportData += (sourceData[i].temp_count.unknown / total * 100) + "%" + ",";
        exportData += (sourceData[i].temp_count.abnormal / total_withoutUnknown * 100) + "%" + ",";
        exportData += (sourceData[i].temp_count.normal / total_withoutUnknown * 100) + "%" + ",";
        exportData += sourceData[i].temp_count.abnormal + ",";
        exportData += sourceData[i].temp_count.normal + ",";
        exportData += sourceData[i].temp_count.unknown + "\r\n";
      }
      this.handleExportReport(exportData);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  async handleParseData_Temperature(sourceData) {
    const {token} = this.props;
    var data = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    await apiFreezerList(data)
    .then(function (response) {
      let freezerMap = [];
      for(var i=0 ; i<response.data.freezers.length ; ++i) {
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }
      let exportData = "門市型態,區域,門市名稱,門市代碼,冰箱名稱,事件發生時間,輸入第一次原因時間,原因,輸入結果時間,結果,異常處理時間"+"\r\n";
      for(let i=0 ; i<sourceData.length ; ++i) {
        exportData += this.state.ExportDataByTypeStore.type_name + ",";
        exportData += this.state.ExportDataByTypeStore.region_name + ",";
        exportData += this.state.ExportDataByTypeStore.branch_name + ",";
        exportData += this.state.ExportDataByTypeStore.branch_code + ",";
        exportData += freezerMap[sourceData[i].target_id] + ",";
        exportData += sourceData[i].event_time + ",";
        exportData += sourceData[i].causeTime + ",";
        exportData += sourceData[i].cause.replace(/\n/g," ") + ",";
        exportData += sourceData[i].conclusionTime + ",";
        exportData += sourceData[i].conclusion.replace(/\n/g," ") + ",";
        exportData += sourceData[i].handlingTime + "\r\n";
      }
      this.handleExportReport(exportData);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  async handleParseData_BatteryAlert(sourceData) {
    const {token} = this.props;
    var data = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    await apiFreezerList(data)
    .then(async function (response) {
      var freezerMap = [];
      for(var i=0 ; i<response.data.freezers.length ; ++i) {
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }
      await apiSensorList(data)
      .then(function (response) {
        var sensorMap = [];
        for(var i=0 ; i<response.data.sensors.length ; ++i) {
          sensorMap[response.data.sensors[i].sensor_id] = response.data.sensors[i];
        }
        let exportData = "門市型態,區域,門市名稱,門市代碼,裝置名稱,綁定冰箱名稱,進入低電量時間"+"\r\n";
        for(let i=0 ; i<sourceData.length ; ++i) {
          exportData += this.state.ExportDataByTypeStore.type_name + ",";
          exportData += this.state.ExportDataByTypeStore.region_name + ",";
          exportData += this.state.ExportDataByTypeStore.branch_name + ",";
          exportData += this.state.ExportDataByTypeStore.branch_code + ",";
          exportData += (sensorMap[sourceData[i].target_id] ? sensorMap[sourceData[i].target_id].name : "") + ",";
          exportData += (sensorMap[sourceData[i].target_id] && sensorMap[sourceData[i].target_id].freezer_id ? freezerMap[sensorMap[sourceData[i].target_id].freezer_id] : "") + ",";
          exportData += sourceData[i].timestamp + "\r\n";
        }
        this.handleExportReport(exportData);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  async reportBySensorList() {
    const {token} = this.props;
    var data = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    this.setState({blocking: true});
    await apiFreezerList(data)
    .then(async function (response) {
      var freezerMap = [];
      for(var i=0 ; i<response.data.freezers.length ; ++i) {
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }
      await apiSensorList(data)
      .then(function (response) {
        let exportData = "門市型態,區域,門市名稱,門市代碼,綁定冰箱名稱,電量"+"\r\n";
        for(var i=0 ; i<response.data.sensors.length ; ++i) {
          if(response.data.sensors[i].status != 4) {
            exportData += this.state.ExportDataByTypeStore.type_name + ",";
            exportData += this.state.ExportDataByTypeStore.region_name + ",";
            exportData += this.state.ExportDataByTypeStore.branch_name + ",";
            exportData += this.state.ExportDataByTypeStore.branch_code + ",";
            //exportData += response.data.sensors[i].name + ",";
            exportData += (response.data.sensors[i].freezer_id ? freezerMap[response.data.sensors[i].freezer_id] : "") + ",";
            exportData += (response.data.sensors[i].last_data && response.data.sensors[i].last_data.battery ? response.data.sensors[i].last_data.battery.estimated_Capacity + "%" : "") + "\r\n";
          }
        }
        this.handleExportReport(exportData);
        this.setState({blocking: false});
      }.bind(this))
      .catch(function (error) {
        console.log(error);
        this.setState({blocking: false});
      }.bind(this));
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  async reportCalibrationList() {
    const {token} = this.props;
    var data_sensorlist = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    this.setState({blocking: true});
    await apiSensorList(data_sensorlist)
    .then(async function (response) {
      var sensorMap = [], sensorIds = [];
      for(var i=0 ; i<response.data.sensors.length ; ++i) {
        sensorIds.push(response.data.sensors[i].sensor_id);
        sensorMap[response.data.sensors[i].sensor_id] = response.data.sensors[i].name;
      }
      var data_calibrationlist = {
        sensor_ids: sensorIds,
        token: token
      }
      await apiSensorCalibrationListBySensors(data_calibrationlist)
      .then(function (response) {
        //console.log("apiSensorCalibrationListBySensors response, ", response);
        let exportData = "門市型態,區域,門市名稱,門市代碼,裝置ID,裝置名稱,上傳時間,校正參數,結果,備註"+"\r\n";
        if(response.data.sensors_calibration) {
          for(var i=0 ; i<response.data.sensors_calibration.length ; ++i) {
            for(var j=0 ; j<response.data.sensors_calibration[i].calibrations.length ; ++j) {
              const qualified = response.data.sensors_calibration[i].calibrations[j].qualified;
              if(qualified !== 0 && qualified !== 1 && qualified !== 2)
              {
                continue;
              }
              exportData += this.state.ExportDataByTypeStore.type_name + ",";
              exportData += this.state.ExportDataByTypeStore.region_name + ",";
              exportData += this.state.ExportDataByTypeStore.branch_name + ",";
              exportData += this.state.ExportDataByTypeStore.branch_code + ",";
              exportData += response.data.sensors_calibration[i].sensor_id + ",";
              exportData += (sensorMap[response.data.sensors_calibration[i].sensor_id] || "") + ",";
              exportData += response.data.sensors_calibration[i].calibrations[j].date + ",";
              exportData += this.parseCalibrationAdjustment(response.data.sensors_calibration[i].calibrations[j].adjustment) + ",";
              exportData += this.parseCalibrationQualified(response.data.sensors_calibration[i].calibrations[j].qualified) + ",";
              exportData += response.data.sensors_calibration[i].calibrations[j].descr + "\r\n";
            }
          }
        }
        this.handleExportReport(exportData);
        this.setState({blocking: false});
      }.bind(this))
      .catch(function (error) {
        console.log(error);
        this.setState({blocking: false});
      }.bind(this));
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  parseCalibrationAdjustment(data) {
    var result = "";
    if(data && data.length == 3) {
      result = "\"" + "(" + data[0] + "," + data[1] + "," + data[2] + ")" + "\"";
    }
    return result;
  }

  parseCalibrationQualified(data) {
    var result = "";
    switch(data) {
      case 0: result = Locales.correction.損壞; break;
      case 1: result = Locales.correction.合格; break;
      case 2: result = Locales.correction.已修正; break;
    }
    return result;
  }

  async reportFreezerHistory() {
    const {token} = this.props;
    var data_freezerlist = {
      branch_id: this.state.ExportDataByTypeStore.branch_id,
      token: token
    }
    this.setState({blocking: true});
    await apiFreezerList(data_freezerlist)
    .then(async function (response) {
      let freezerMap = [], freezer_ids = [], freezerHistory = [];
      for(let i=0 ; i<response.data.freezers.length ; ++i) {
        freezer_ids.push(response.data.freezers[i].freezer_id);
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }
      if(freezer_ids.length == 0) {
        this.setState({blocking: false});
        alert(Locales.common.此地點無冰箱);
      }
      for(let i=0 ; i<freezer_ids.length ; ++i) {
        let action = [];
        if(this.state.reportType == "pause") {
          action = ["pause", "resume"];
        } else {
          action = ["ALL"];
        }
        var data_freezerhistory = {
          freezer_id: freezer_ids[i],
          action: action,
          period: [ moment(this.state.from).format("YYYY-MM-DD"),
                    moment(this.state.to).format("YYYY-MM-DD") ],
          token: token
        }
        await apiFreezerHistory(data_freezerhistory)
        .then(function (response) {
          //console.log("apiFreezerHistory response, ", response);
          freezerHistory.push(response.data);
          if( (freezerHistory.length == freezer_ids.length && this.state.reportType == "pause") ||
              (freezerHistory.length == (freezer_ids.length*2) && this.state.reportType == "freezer") ) {
            let exportData = this.state.reportType == "pause" ?
              "門市型態,區域,門市名稱,門市代碼,冰箱名稱,狀態,狀態起始時間,原因,預計暫停時間,狀態結束時間,總暫停時間"+"\r\n" :
              "門市型態,區域,門市名稱,門市代碼,冰箱名稱,狀態,操作時間"+"\r\n";
            for(let i=0 ; i<freezerHistory.length ; ++i) {
              for(let j=0 ; j<freezerHistory[i].events.length ; ++j) {
                //console.log("freezerHistory[i].events, ", freezerHistory[i].events[j]);
                if(this.state.reportType == "pause" && freezerHistory[i].events[j].action == "resume") {
                  continue;
                }
                exportData += this.state.ExportDataByTypeStore.type_name + ",";
                exportData += this.state.ExportDataByTypeStore.region_name + ",";
                exportData += this.state.ExportDataByTypeStore.branch_name + ",";
                exportData += this.state.ExportDataByTypeStore.branch_code + ",";
                exportData += (freezerMap[freezerHistory[i].freezer_id] || "") + ",";
                exportData += this.getActionName(freezerHistory[i].events[j].action) + ",";
                exportData += freezerHistory[i].events[j].ts.split("+")[0];
                if (this.state.reportType == "pause") {
                  exportData += "," + (freezerHistory[i].events[j].to.pause.reason ?
                                freezerHistory[i].events[j].to.pause.reason.replace(/\n/g," ") : Locales.common.其他 ) + ",";
                  exportData += freezerHistory[i].events[j].to.pause.period + "分" + ",";
                  if(freezerHistory[i].events[j+1] && freezerHistory[i].events[j+1].action == "resume") {
                    var pauseStartTime = moment(moment(freezerHistory[i].events[j].ts.split("+")[0]).format("YYYY/MM/DD HH:mm"));
                    var pauseEndTime = moment(moment(freezerHistory[i].events[j+1].ts.split("+")[0]).format("YYYY/MM/DD HH:mm"));
                    var pausePeriod = moment.duration(pauseEndTime.diff(pauseStartTime)).asMinutes();
                    exportData += freezerHistory[i].events[j+1].ts.split("+")[0] + ",";
                    exportData += pausePeriod + "分" + "\r\n";
                  } else {
                    var pauseEndTime = moment(freezerHistory[i].events[j].ts.split("+")[0]).add(freezerHistory[i].events[j].to.pause.period, 'minutes').format("YYYY/MM/DD HH:mm");
                    exportData += pauseEndTime + ",";
                    exportData += freezerHistory[i].events[j].to.pause.period + "分" + "\r\n";
                  }
                } else {
                  exportData += "\r\n";
                }
              }
            }
            this.handleExportReport(exportData);
            this.setState({blocking: false});
          }
        }.bind(this))
        .catch(function (error) {
          console.log(error);
          this.setState({blocking: false});
        }.bind(this));
        if(this.state.reportType == "freezer") {
          var data_freezerPropertyHistory = {
            freezer_id: freezer_ids[i],
            action: ["add", "update"],
            period: [ moment(this.state.from).format("YYYY-MM-DD"),
                      moment(this.state.to).format("YYYY-MM-DD") ],
            token: token
          }
          await apiFreezerPropertyHistory(data_freezerPropertyHistory)
          .then(function (response) {
            freezerHistory.push(response.data);
            if(freezerHistory.length == (freezer_ids.length*2)) {
              let exportData = "門市型態,區域,門市名稱,門市代碼,冰箱名稱,狀態,操作時間"+"\r\n";
              for(let i=0 ; i<freezerHistory.length ; ++i) {
                for(let j=0 ; j<freezerHistory[i].events.length ; ++j) {
                  //console.log("freezerHistory[i].events, ", freezerHistory[i].events[j]);
                  exportData += this.state.ExportDataByTypeStore.type_name + ",";
                  exportData += this.state.ExportDataByTypeStore.region_name + ",";
                  exportData += this.state.ExportDataByTypeStore.branch_name + ",";
                  exportData += this.state.ExportDataByTypeStore.branch_code + ",";
                  exportData += (freezerMap[freezerHistory[i].freezer_id] || "") + ",";
                  exportData += this.getActionName(freezerHistory[i].events[j].action) + ",";
                  exportData += freezerHistory[i].events[j].ts.split("+")[0] += "\r\n";
                }
              }
              this.handleExportReport(exportData);
              this.setState({blocking: false});
            }
          }.bind(this))
          .catch(function (error) {
            console.log(error);
            this.setState({blocking: false});
          }.bind(this));
        }
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({blocking: false});
    }.bind(this));
    //let exportData = "門市型態,區域,門市名稱,門市代碼,冰箱名稱,狀態,狀態起始時間,原因"+"\r\n";
  }

  getActionName(action) {
    let result = "";
    switch(action) {
      case "pause": result = Locales.report.暫停; break;
      case "attach": result = Locales.report.綁定; break;
      case "detach": result = Locales.report.解除綁定; break;
      case "add": result = Locales.report.新增; break;
      case "delete": result = Locales.report.刪除; break;
      case "update": result = Locales.report.更新; break;
      case "resume": result = Locales.report.手動解除暫停; break;
      default: result = action; break;
    }
    return result;
  }

  handleExportReport(data) {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number
    {
      var _utf = "\uFEFF";
      var csvData = new Blob([_utf, data], {
        type: 'text/csv'
      });
      navigator.msSaveBlob(csvData, this.getReportNameByType() + '.csv');
    }
    else  // If another browser, return 0
    {
      //console.log("not ie");
      let url = 'data:text/csv;charset=utf8,\ufeff' + encodeURIComponent(data);
      let link = document.createElement('a');
      link.href = url;
      link.download = this.getReportNameByType() + ".csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  handleExportReportByMonth = () => {
    if (JSON.stringify(this.state.ExportDataByMonthStore) == "{}") {
      alert(Locales.common.請選擇位置);
      return;
    }
    if (this.state.reportMonth == "") {
      alert(Locales.common.請選擇報表月份);
      return;
    }
    this.setState({
      multiBranchExport_Total: 0,
      multiBranchExport_Now: 0
    });
    this.setState({blocking: true});
    apiGetReportList()
    .then(function (response) {
      //console.log("response, ", response);
      this.setState({blocking: false});
      var reportExist = false;
      if(response.status == 200 && response.data.files) {
        let url = "https://support.ushop-plus.com/ccm/ccm/advantech-Carrefour/" +
                  this.state.reportMonth.replace("/", "-") + "/" +
                  this.state.ExportDataByMonthStore.branch_code + "_" +
                  this.state.ExportDataByMonthStore.branch_name + ".zip";
        for(let i=0 ; i<response.data.files.length ; ++i) {
          if(response.data.files[i] == url) {
            // window.open(url, 'Download');
            let link = document.createElement('a');
            link.href = url;
            link.download =  this.state.reportMonth.replace("/", "-") + "/" +
            this.state.ExportDataByMonthStore.branch_code + "_" +
            this.state.ExportDataByMonthStore.branch_name + ".zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            reportExist = true;
            break;
          }
        }
      }
      if(reportExist == false) {
        alert(Locales.common.無此地點月份報表);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({blocking: false});
    }.bind(this));
  }

  updateDayPickerWrapper(){
    setTimeout(function(){
      const obj =  $(".DayPickerInput-OverlayWrapper");
      let left = obj.offset().left;
      let width = obj.find(".DayPickerInput-Overlay").width();
      let clientWidth =  document.body.clientWidth;
      if(left+width > clientWidth){
        //調整位子
        obj.offset({  left: clientWidth-width });
      }
    },0);
  }

  renderStoreTab() {
    const {store}=this.props;
    var storeTypeList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name && !storeTypeList.includes(store[i].type_name)) {
        storeTypeList.push(store[i].type_name);
      }
    }
    storeTypeList = parseStoreType(storeTypeList);
    return _.map(storeTypeList, storeType => {
      return (
        <Tab eventKey={storeType} key={storeType} title={storeType}>
          <Container style={{width: '100%', margin: "30px 0"}}>
            <Row>
              { this.renderStoreList(storeType) }
            </Row>
          </Container>
        </Tab>
      );
    });
  }

  renderStoreList(storeType) {
    const {store}=this.props;
    var storeList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name == storeType) {
        storeList.push(store[i]);
      }
    }
    var type = "";
    if (this.state.selectStoreModalType == "type") {
      type = "checkbox";
    } else if (this.state.selectStoreModalType == "month") {
      type = "radio";
    }
    return _.map(storeList, store => {
      let checked = false;
      if (this.state.selectStoreModalType == "type") {
        for(var i=0 ; i<this.state.ExportDataByTypeStores.length ; ++i) {
          if(store.branch_id == this.state.ExportDataByTypeStores[i].branch_id) {
            checked = true;
            break;
          }
        }
      } else if (this.state.selectStoreModalType == "month") {
        checked = (store.branch_id == this.state.ExportDataByMonthStore.branch_id);
      }
      return (
        <Col key={store.branch_id} md={2}>
          <input type={type} checked={checked} onChange={() => this.handleStoreChange(store)}/>
          <span style={{paddingLeft: "10px", cursor: "pointer"}} onClick={() => this.handleStoreChange(store)}>{store.branch_name}</span>
        </Col>
      );
    });
  }

  handleStoreChange(store) {
    if (this.state.selectStoreModalType == "type") {
      let tmpArray = [], remove = false;
      for(let i=0 ; i<this.state.ExportDataByTypeStores.length ; ++i) {
        if(store != this.state.ExportDataByTypeStores[i]) {
          tmpArray.push(this.state.ExportDataByTypeStores[i]);
        } else {
          remove = true;
        }
      }
      if(remove == false) {
        tmpArray.push(store);
      }
      this.setState({ExportDataByTypeStores: tmpArray});
    } else if (this.state.selectStoreModalType == "month") {
      this.setState({ExportDataByMonthStore: store});
    }
  }

  getReportNameByType() {
    var name = this.state.ExportDataByTypeStore.branch_name + "_" + this.state.ExportDataByTypeStore.branch_code + "_";
    switch(this.state.reportType) {
      case "temp_statistic": name += Locales.report.溫度合格比率報表; break;
      case "temperature": name += Locales.report.溫度警示報表; break;
      case "battery": name += Locales.report.當前電量報表; break;
      case "inspect": name += Locales.report.巡檢報表; break;
      case "receipt": name += Locales.report.收貨報表; break;
      case "transport": name += Locales.report.運輸報表; break;
      case "pause": name += Locales.report.冰箱暫停報表; break;
      case "correction": name += Locales.report.校正報表; break;
      case "freezer": name += Locales.report.冰箱操作報表; break;
    }
    return name;
  }

  render() {
    const { store }=this.props;
    const { from, to } = this.state;
    const modifiers = { start: from, end: to };
    //console.log("this.state.from, ", this.state.from);
    var options = [];
    for(var i=0 ; i<store.length ; ++i) {
      options.push({value: store[i].branch_id, label: store[i].branch_name});
    }
    const reportTypes = [
      {value: "temp_statistic", label: Locales.report.溫度合格比率報表},
      {value: "temperature", label:  Locales.report.溫度警示報表},
      {value: "battery", label:  Locales.report.當前電量報表},
      {value: "inspect", label:  Locales.report.巡檢報表},
      {value: "receipt", label:  Locales.report.收貨報表},
      {value: "transport", label:  Locales.report.運輸報表},
      {value: "pause", label:  Locales.report.冰箱暫停報表},
      {value: "correction", label:  Locales.report.校正報表},
      {value: "freezer", label:  Locales.report.冰箱操作報表}
    ];
    const monthTyps = [
      /*{value: moment().format("YYYY/MM"), label: moment().format(Locales.common.YYYY年MM月份)},*/
      {value: moment().subtract(1, 'month').format("YYYY/MM"), label: moment().subtract(1, 'month').format(Locales.common.YYYY年MM月份)},
      {value: moment().subtract(2, 'month').format("YYYY/MM"), label: moment().subtract(2, 'month').format(Locales.common.YYYY年MM月份)},
      {value: moment().subtract(3, 'month').format("YYYY/MM"), label: moment().subtract(3, 'month').format(Locales.common.YYYY年MM月份)}
    ];
    let exportDataByTypeStores = "";
    for(let i=0 ; i<this.state.ExportDataByTypeStores.length ; ++i) {
      if(i > 2) {
        exportDataByTypeStores += Locales.common.及其他間位置.format(this.state.ExportDataByTypeStores.length-3);
        break;
      } else if(i != 0) {
        exportDataByTypeStores += "、";
      }
      exportDataByTypeStores += this.state.ExportDataByTypeStores[i].branch_name;
    }
    var export_Process = "";
    if(this.state.multiBranchExport_Total > 0) {
      export_Process = " (" + this.state.multiBranchExport_Now + "/" + this.state.multiBranchExport_Total + ")"
    }
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中 + export_Process}>
        <div className="Subpage">
          <div className="ReportSubpage">
            <Modal
              isOpen={this.state.showStoreModal}
              style={customStyles}
              onRequestClose={this.handleCloseStoreModal}
              shouldCloseOnOverlayClick={true}
              contentLabel="Minimal Modal Example">
              <Tabs id="storeTabs" className="tabStyle" animation={false}>
                { this.renderStoreTab() }
              </Tabs>
            </Modal>
            <div>
              <span><h3>{ Locales.report.匯出記錄報表}</h3></span><br />
              <Row>
                <Col lg={3} md={6} className="form-group">
                  <span style={{display:"block"}}>{ Locales.report.位置}：</span>
                  <div style={{width: "100%", display: "inline-block"}}>
                    <span className="SelectStore_ReportPage" style={exportDataByTypeStores == "" ? {color: "hsl(0,0%,50%)"} : {}} onClick={this.handleOpenStoreModalByType}>
                      { exportDataByTypeStores ||  Locales.common.請選擇位置 }
                    </span>
                    {/*<Select options={options} placeholder={"請選擇"} onChange={(e) => { this.setState({ExportDataByTypeStore: e})}} style={{width: "100%" }} />*/}
                  </div>
                </Col>
                <Col lg={3} md={6} className="form-group">
                  <span style={{display:"block"}}>{ Locales.report.報表類型}：</span>
                  <div style={{width: "100%", display: "inline-block"}}>
                    <Select options={reportTypes} placeholder={ Locales.common.請選擇} style={{width: "100%" }} onChange={e=>this.setState({reportType: e.value})} />
                  </div>
                </Col>
                <Col lg={4} md={7} className="form-group"
                     style={{visibility : this.state.reportType == "battery" || this.state.reportType == "correction" ? "hidden" : "visible"}}
                     onClick={this.updateDayPickerWrapper}>
                  <span style={{display:"block"}}>{ Locales.report.起始時間}：</span>
                  <div className="InputFromTo ExportReportDayPicker" style={{display: "inline-block",textAlign: "center"}}>
                    <DayPickerInput
                      value={from}
                      placeholder={ Locales.report.起始時間}
                      format='YYYY/MM/DD'
                      formatDate={formatDate}
                      parseDate={parseDate}
                      dayPickerProps={{
                        selectedDays: [from, { from, to }],
                        disabledDays: { after: to },
                        toMonth: to,
                        modifiers,
                        numberOfMonths: 2,
                        onDayClick: () => this.to.getInput().focus()
                      }}
                      onDayChange={this.handleFromChange}
                    />
                    <span className="InputFromTo-to">&nbsp;&nbsp; ～ &nbsp;&nbsp;</span>

                    <DayPickerInput
                      ref={el => (this.to = el)}
                      value={to}
                      placeholder={ Locales.report.結束時間}
                      format='YYYY/MM/DD'
                      formatDate={formatDate}
                      parseDate={parseDate}
                      dayPickerProps={{
                        selectedDays: [from, { from, to }],
                        disabledDays: { before: from },
                        modifiers,
                        month: from,
                        fromMonth: from,
                        numberOfMonths: 2,
                      }}
                      onDayChange={this.handleToChange}
                    />
                  </div>
                </Col>
                <Col lg={2} md={3} className="form-group">
                  <span style={{display:"block"}}>&nbsp;</span>
                  <div className="ExportReport" style={{margin:"0"}} onClick={this.handleExportReportByType}><button>{ Locales.report.匯出}</button></div>
                </Col>
              </Row>
              <br /><br />
              <span><h3>{ Locales.report.月份報表匯出}</h3></span><br />
              <Row>
                <Col lg={3} md={5} className="form-group">
                  <span style={{display:"block"}}>{ Locales.report.位置}：</span>
                  <div style={{width: "100%", display: "inline-block"}}>
                    <span className="SelectStore_ReportPage" style={this.state.ExportDataByMonthStore.branch_name == null ? {color: "hsl(0,0%,50%)"} : {}} onClick={this.handleOpenStoreModalByMonth}>
                      { this.state.ExportDataByMonthStore.branch_name ||  Locales.common.請選擇位置 }
                    </span>
                    {/*<Select options={options} placeholder={"請選擇"} onChange={(e) => { this.setState({ExportDataByMonthStore: e})}} style={{width: "100%" }} />*/}
                  </div>
                </Col>
                <Col lg={3} md={5} className="form-group">
                  <span style={{display:"block"}}>{ Locales.report.報表月份}：</span>
                  <div style={{width: "100%", display: "inline-block"}}>
                    <Select options={monthTyps} placeholder={ Locales.common.請選擇} style={{width: "100%" }} onChange={e=>this.setState({reportMonth: e.value})} />
                  </div>
                </Col>
                <Col lg={6} md={2} className="form-group">
                  <span style={{display:"block"}}>&nbsp;</span>
                  <div className="ExportReport" style={{margin:"0"}} onClick={this.handleExportReportByMonth}><button>{ Locales.report.匯出}</button></div>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </BlockUi>
    );
  }
}

function mapStateToProps({ store, token }, ownProps) {
  return { store, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(ReportSubpage);
