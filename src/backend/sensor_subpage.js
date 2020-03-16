import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { apiFreezerList, apiSensorList, apiGatewayListByBranch, apiGatewayUpdate,
         apiSensorUpdate, apiSensorDelete, apiGatewayDelete, apiGatewayDeActivate, toCancelApi,
         apiSensorChangeType, apiSensorDeActivate, apiSensorDisable, apiFreezerDetach,
         apiFreezerAttach, apiSensorCalibrate } from "../utils/api";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import Modal from 'react-modal';
import filterFactory, {
  selectFilter,
  textFilter
} from "react-bootstrap-table2-filter";
import {CompTable} from "../components/comp_Table";
import { Locales } from "../lang/language";
import ConfirmDialog from '../components/confirm_dialog';
import AlertDialog from '../components/alert_dialog';
import BlockUi from 'react-block-ui';
import Select from 'react-select';

const customStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '10%',
    left: 'calc(50% - 280px)',
    right: '0px',
    bottom: '0px',
    width: '570px',
    height: '80%',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};

class SensorSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking_sensor: false,
      blocking_gateway: false,
      selectStoreID: "",
      freezerList: [],
      SensorList_530: [],
      SensorList_472: [],
      SensorList_120: [],
      showModifyGatewayModal: false,
      showModifySensorModal: false,

      gatewayId: "",
      gatewayName: "",
      gatewayNote: "",

      sensorId: "",
      sensorName: "",
      sensorType: "",
      sensorFreezer: "",
      sensorStatus: "",

      gatewayNameNull: false,
      sensorNameNull: false,

      showAlertModal: false,
      showAlertModalContent: "",

      showConfirmDeleteGatewayModal: false,
      confirmDeleteGatewayName: "",
      confirmDeleteGatewayID: "",

      showConfirmDeleteSensorModal: false,
      confirmDeleteSensorName: "",
      confirmDeleteSensorID: "",

      showConfirmDeActivateSensorModal: false,
      confirmDeActivateSensorName: "",
      confirmDeActivateSensorID: "",

      showConfirmDisableSensorModal: false,
      confirmDisableSensorName: "",
      confirmDisableSensorID: "",

      showConfirmCalibrateSensorModal: false,
      confirmCalibrateSensorName: "",
      confirmCalibrateSensorID: "",
    };
  }

  componentWillUnmount() {
    toCancelApi();
  }

  componentDidMount() {
    const { store } = this.props;
    this.setSelectStore(store);
  }

  componentWillReceiveProps(nextProps) {
    this.setSelectStore(nextProps.store);
  }

  setSelectStore(store) {
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].select) {
        this.setState({ selectStoreID: store[i].branch_id }, function() {
          this.getFreezerDataByStore();
          this.getGatewayList();
        });
        break;
      }
    }
  }

  getFreezerDataByStore() {
    const {token} = this.props;
    var data = {
      branch_id: this.state.selectStoreID,
      token: token
    };
    apiFreezerList(data)
    .then(function (response) {
      this.setState({ freezerList: response.data.freezers || [] }, function() {
        this.getSensorList();
      });
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  getSensorList() {
    const {token} = this.props;
    var data = {
      branch_id: this.state.selectStoreID,
      token: token
    };
    this.setState({SensorList_120: [], blocking_sensor: true});
    apiSensorList(data)
    .then(function (response) {
      var tmpSensorList = [];
      if(response.data.sensors && response.data.sensors.length > 0) {
        for(var i=0 ; i<response.data.sensors.length ; ++i) {
          if(response.data.sensors[i].status != 4) {
            response.data.sensors[i].freezer_name = this.getFreezerName(response.data.sensors[i].freezer_id);
            tmpSensorList.push(response.data.sensors[i]);
          }
        }
      }
      this.setState({SensorList_120: tmpSensorList, blocking_sensor: false});
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({blocking_sensor: false});
    }.bind(this));
  }

  getGatewayList() {
    const {token} = this.props;
    var data = {
      branch_id: this.state.selectStoreID,
      token: token
    };
    //console.log("storeId, ", storeId);
    this.setState({SensorList_530: [], SensorList_472:[], blocking_gateway: true});
    apiGatewayListByBranch(data)
    .then(function (response) {
      //console.log("getGatewayList, ", response);
      var sensor530list = [], sensor472list = [];
      if (response.data.gateways) {
        for(var i=0 ; i<response.data.gateways.length ; ++i) {
          if(response.data.gateways[i].status != 4) {
            response.data.gateways[i].version = response.data.gateways[i].last_hb.sw_ver || "";
            if (response.data.gateways[i].model_name == "eis-land-530") {
              sensor530list.push(response.data.gateways[i]);
            } else {//} if (response.data.gateways[i].model_name == "472") {
              sensor472list.push(response.data.gateways[i]);
            }
          }
        }
      }
      this.setState({SensorList_472: sensor472list, SensorList_530: sensor530list, blocking_gateway: false});
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({blocking_gateway: false});
    }.bind(this));
  }

  handleOpenModifyGatewayModal = (gateway_id, name, description) => {
    this.setState({ showModifyGatewayModal: true, gatewayId: gateway_id, gatewayName: name, gatewayNote: description, gatewayNameNull: false });
  }
  handleCloseModifyGatewayModal = () => {
    this.setState({ showModifyGatewayModal: false, gatewayId: "", gatewayName: "", gatewayNote: "" });
  }

  handleOpenModifySensorModal = (row) => {
    this.setState({ showModifySensorModal: true, sensorId: row.sensor_id, sensorName: row.name,
                    sensorType: row.sensor_type, sensorFreezer: row.freezer_id, sensorStatus: row.status, sensorNameNull: false });
  }
  handleCloseModifySensorModal = () => {
    this.setState({ showModifySensorModal: false, sensorId: "", sensorName: "", sensorType: "", sensorStatus: "" });
  }

  handleOpenAlertModal = (content) => {
    this.setState({ showAlertModal: true, showAlertModalContent: content });
  }
  handleCloseAlertModal = () => {
    this.setState({ showAlertModal: false });
  }

  handleOpenConfirmDeleteGatewayModal = (row) => {
    this.setState({ showConfirmDeleteGatewayModal: true, confirmDeleteGatewayName: row.name, confirmDeleteGatewayID: row.gateway_id });
  }
  handleCloseConfirmDeleteGatewayModal = () => {
    this.setState({ showConfirmDeleteGatewayModal: false });
  }

  handleOpenConfirmDeleteSensorModal = (row) => {
    this.setState({ showConfirmDeleteSensorModal: true, confirmDeleteSensorName: row.name, confirmDeleteSensorID: row.sensor_id });
  }
  handleCloseConfirmDeleteSensorModal = () => {
    this.setState({ showConfirmDeleteSensorModal: false });
  }

  handleOpenConfirmDeActivateSensorModal = (name, sensor_id) => {
    this.setState({ showConfirmDeActivateSensorModal: true, confirmDeActivateSensorName: name, confirmDeActivateSensorID: sensor_id });
  }
  handleCloseConfirmDeActivateSensorModal = () => {
    this.setState({ showConfirmDeActivateSensorModal: false });
  }

  handleOpenConfirmDisableSensorModal = (name, sensor_id) => {
    this.setState({ showConfirmDisableSensorModal: true, confirmDisableSensorName: name, confirmDisableSensorID: sensor_id });
  }
  handleCloseConfirmDisableSensorModal = () => {
    this.setState({ showConfirmDisableSensorModal: false });
  }

  handleOpenConfirmCalibrateSensorModal = (name, sensor_id) => {
    this.setState({ showConfirmCalibrateSensorModal: true, confirmCalibrateSensorName: name, confirmCalibrateSensorID: sensor_id });
  }
  handleCloseConfirmCalibrateSensorModal = () => {
    this.setState({ showConfirmCalibrateSensorModal: false });
  }

  handleModifyGateway = () => {
    if (this.state.gatewayName == "") {
      this.setState({gatewayNameNull: true});
      return;
    }
    const {token} = this.props;
    var data = {
      gateway_id: this.state.gatewayId,
      name: this.state.gatewayName,
      description: this.state.gatewayNote,
      token: token
    };
    apiGatewayUpdate(data)
    .then(function (response) {
      this.getGatewayList();
      this.handleCloseModifyGatewayModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleModifySensor = () => {
    if (this.state.sensorName == "") {
      this.setState({sensorNameNull: true});
      return;
    }
    const {token} = this.props;
    var data = {
      sensor_id: this.state.sensorId,
      name: this.state.sensorName,
      token: token
    };
    apiSensorUpdate(data)
    .then(function (response) {
      let changeType = false;
      for(var i=0 ; i<this.state.SensorList_120.length ; ++i) {
        if(this.state.SensorList_120[i].sensor_id == this.state.sensorId) {
          if(this.state.SensorList_120[i].sensor_type != this.state.sensorType) {
            changeType = true;
            this.callAPISensorChangeType();
          }
          if(this.state.sensorFreezer != "") {
            if(this.state.SensorList_120[i].freezer_id == "") {
              this.callAPIFreezerAttach(this.state.SensorList_120[i].sensor_id, this.state.sensorFreezer, "getFreezerDataByStore");
            } else if(this.state.SensorList_120[i].freezer_id != this.state.sensorFreezer) {
              if(this.state.sensorFreezer == "detach") {
                this.callAPIFreezerDetach(this.state.SensorList_120[i].sensor_id, this.state.SensorList_120[i].freezer_id, "getFreezerDataByStore");
              } else {
                this.callAPIFreezerDetach(this.state.SensorList_120[i].sensor_id, this.state.SensorList_120[i].freezer_id, "callAPIFreezerAttach");
              }
            }
          }
          break;
        }
      }
      if(changeType == false) {
        this.getSensorList();
      }
      this.handleCloseModifySensorModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPISensorChangeType() {
    const {token} = this.props;
    var data = {
      sensor_id: this.state.sensorId,
      sensor_type: this.state.sensorType,
      token: token
    };
    apiSensorChangeType(data)
    .then(function (response) {
      this.getSensorList();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleDeleteSensor = () => {
    for(var i=0 ; i<this.state.SensorList_120.length ; ++i) {
      if(this.state.SensorList_120[i].sensor_id == this.state.confirmDeleteSensorID) {
        switch(this.state.SensorList_120[i].status) {
          case 11:
          case 12:
          case 17:
            this.callAPIFreezerDetach(this.state.confirmDeleteSensorID, this.state.SensorList_120[i].freezer_id, "callAPISensorDeActivate");
          break;
          case 10:
          case 15:
            this.callAPISensorDeActivate();
          break;
          default:
            this.callAPISensorDelete();
          break;
        }
        break;
      }
    }
  }

  handleDeActivateSensor = () => {
    const {token} = this.props;
    var data = {
      sensor_id: this.state.confirmDeActivateSensorID,
      token: token
    };
    apiSensorDeActivate(data)
    .then(function (response) {
      this.getSensorList();
      this.handleCloseConfirmDeActivateSensorModal();
      this.handleCloseModifySensorModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleDisableSensor = () => {
    const {token} = this.props;
    var data = {
      sensor_id: this.state.confirmDisableSensorID,
      token: token
    };
    apiSensorDisable(data)
    .then(function (response) {
      this.getSensorList();
      this.handleCloseConfirmDisableSensorModal();
      this.handleCloseModifySensorModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleCalibrateSensor = () => {
    const {token} = this.props;
    var data = {
      sensor_id: this.state.confirmCalibrateSensorID,
      token: token
    };
    apiSensorCalibrate(data)
    .then(function (response) {
      this.getSensorList();
      this.handleCloseConfirmCalibrateSensorModal();
      this.handleCloseModifySensorModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPIFreezerDetach(sensor_id, freezer_id, callbackFunc) {
    const {token} = this.props;
    var data = {
      freezer_id: freezer_id,
      sensor_id: sensor_id,
      token: token
    };
    apiFreezerDetach(data)
    .then(function (response) {
      switch(callbackFunc) {
        case "callAPISensorDeActivate":
          this.callAPISensorDeActivate();
          break;
        case "getFreezerDataByStore":
          this.getFreezerDataByStore();
          break;
        case "callAPIFreezerAttach":
          this.callAPIFreezerAttach(sensor_id, this.state.sensorFreezer, "getFreezerDataByStore");
          break;
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPIFreezerAttach(sensor_id, freezer_id, callbackFunc) {
    const {token} = this.props;
    var data = {
      freezer_id: freezer_id,
      sensor_id: sensor_id,
      token: token
    };
    apiFreezerAttach(data)
    .then(function (response) {
      if(response.data.status == 0 && response.data.error_code == 7011) {
        this.handleOpenAlertModal(Locales.common.此狀態下無法綁定冰箱);
      }
      switch(callbackFunc) {
        case "getFreezerDataByStore":
          this.getFreezerDataByStore();
        break;
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPISensorDeActivate() {
    const {token} = this.props;
    var data = {
      sensor_id: this.state.confirmDeleteSensorID,
      token: token
    };
    apiSensorDeActivate(data)
    .then(function (response) {
      this.callAPISensorDelete();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPISensorDelete() {
    const {token} = this.props;
    var data = {
      sensor_id: this.state.confirmDeleteSensorID,
      token: token
    };
    apiSensorDelete(data)
    .then(function (response) {
      if(response.data.status == 0 && response.data.error_code == 7011) {
        this.handleOpenAlertModal(Locales.common.此狀態下無法刪除);
      }
      this.getSensorList();
      this.handleCloseConfirmDeleteSensorModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleDeleteGateway = () => {
    const {token} = this.props;
    var data = {
      gateway_id: this.state.confirmDeleteGatewayID,
      token: token
    };
    var needDeActivate = false;
    for(let i=0 ; i<this.state.SensorList_530.length ; ++i) {
      if(this.state.SensorList_530[i].gateway_id == this.state.confirmDeleteGatewayID) {
        if( this.state.SensorList_530[i].status == 11 ||
            this.state.SensorList_530[i].status == 13 ||
            this.state.SensorList_530[i].status == 14 ) {
          needDeActivate = true;
        }
        break;
      }
    }
    if(needDeActivate == false) {
      for(let i=0 ; i<this.state.SensorList_472.length ; ++i) {
        if(this.state.SensorList_472[i].gateway_id == this.state.confirmDeleteGatewayID) {
          if( this.state.SensorList_472[i].status == 11 ||
              this.state.SensorList_472[i].status == 13 ||
              this.state.SensorList_472[i].status == 14 ) {
            needDeActivate = true;
          }
          break;
        }
      }
    }
    if(needDeActivate == true) {
      apiGatewayDeActivate(data)
      .then(function (response) {
        this.callAPIGatewayDelete(data);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    } else {
      this.callAPIGatewayDelete(data);
    }
  }

  callAPIGatewayDelete(data) {
    apiGatewayDelete(data)
    .then(function (response) {
      if(response.data.status == 0 && response.data.error_code == 7011) {
        this.handleOpenAlertModal(Locales.common.此狀態下無法刪除);
      }
      this.getGatewayList();
      this.handleCloseConfirmDeleteGatewayModal();
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  renderModifyGatewayModal(gatewayType) {
    return (
      <Modal
         isOpen={this.state.showModifyGatewayModal}
         style={customStyles}
         onRequestClose={this.handleCloseModifyGatewayModal}
         shouldCloseOnOverlayClick={true}
         contentLabel="Minimal Modal Example">
         <div style={{fontSize: "20px", fontWeight: "bold"}}>{Locales.common.修改}</div><br />
         <table width="100%" className="CorrectSubpageTable">
          <tbody>
            <tr>
              <td width="30%">{Locales.sensor.名稱}<label className="required">*</label></td>
              <td>
                <input type="text" className="InputStyle" style={this.state.gatewayNameNull ? {borderColor: "red"} : {}}
                       value={this.state.gatewayName} onChange={e=>this.setState({gatewayName: e.target.value})} />
              </td>
            </tr>
            <tr>
              <td>{Locales.sensor.註記}</td>
              <td>
                <input type="text" className="InputStyle" value={this.state.gatewayNote} onChange={e=>this.setState({gatewayNote: e.target.value})} />
              </td>
            </tr>
          </tbody>
         </table>
         <div className="confirmBtn">
           <Button onClick={this.handleCloseModifyGatewayModal}>{Locales.common.取消}</Button>
           <Button onClick={this.handleModifyGateway}>{Locales.common.確認}</Button>
         </div>
      </Modal>
    );
  }

  changeSensorType(type) {
    if(type == "mobile" && (this.state.sensorFreezer != "" && this.state.sensorFreezer != "detach")) {
      this.handleOpenAlertModal(Locales.common.已綁定冷凍櫃不可變更為車載);
    } else {
      this.setState({sensorType: type});
    }
  }

  renderModifySensorModal() {
    const sensorTypes = [
      { value: "fixed", label: Locales.sensorType.Fixed },
      { value: "mobile", label:  Locales.sensorType.Mobile }
    ];
    var freezerOptions = [];
    if( this.state.sensorFreezer != "" ) {
      freezerOptions.push({value: "detach", label: Locales.sensor.解除綁定});
    }
    for(var i=0 ; i<this.state.freezerList.length ; ++i) {
      if((typeof this.state.freezerList[i].sensor_ids == "undefined" ||
          this.state.freezerList[i].sensor_ids.length == 0 ||
          this.state.freezerList[i].freezer_id == this.state.sensorFreezer) &&
          (this.state.freezerList[i].status != 3 && this.state.freezerList[i].status != 4)) {
        freezerOptions.push({value: this.state.freezerList[i].freezer_id, label: this.state.freezerList[i].name});
      }
    }
    return (
      <Modal
         isOpen={this.state.showModifySensorModal}
         style={customStyles}
         onRequestClose={this.handleCloseModifySensorModal}
         shouldCloseOnOverlayClick={true}
         contentLabel="Minimal Modal Example">
         <div style={{fontSize: "20px", fontWeight: "bold"}}>{Locales.common.修改}</div><br />
         <table width="100%" className="CorrectSubpageTable">
          <tbody>
            <tr>
              <td width="30%">{Locales.sensor.名稱}<label className="required">*</label></td>
              <td>
                <input type="text" className="InputStyle" style={this.state.sensorNameNull ? {borderColor: "red"} : {}}
                       value={this.state.sensorName} onChange={e=>this.setState({sensorName: e.target.value})} />
              </td>
            </tr>
            <tr>
              <td width="30%">{Locales.sensor.裝置類型}</td>
              <td>
                <Select options={sensorTypes} value={sensorTypes.filter(option=>option.value==this.state.sensorType)} onChange={e=>this.changeSensorType(e.value)}/>
              </td>
            </tr>
            <tr>
              <td width="30%">{Locales.backend.冷凍櫃}</td>
              <td>
                <Select options={freezerOptions} value={freezerOptions.filter(option=>option.value==this.state.sensorFreezer)}
                        onChange={e=>this.setState({sensorFreezer: e.value})}/>
              </td>
            </tr>
            <tr style={{display: (this.state.sensorStatus == 10 || this.state.sensorStatus == 15) ? "" : "none"}}>
              <td colSpan={2} style={{textAlign: "center"}}>
                <Button className="btn" style={{textAlign: "center", fontSize: "18px", width: "300px"}}
                        onClick={()=>this.handleOpenConfirmDeActivateSensorModal(this.state.sensorName, this.state.sensorId)}>{Locales.sensor.解除啟用}</Button>
              </td>
            </tr>
            <tr style={{display: (this.state.sensorStatus == 10 || this.state.sensorStatus == 15) ? "" : "none"}}>
              <td colSpan={2} style={{textAlign: "center"}}>
                <Button className="btn" style={{textAlign: "center", fontSize: "18px", width: "300px"}}
                        onClick={()=>this.handleOpenConfirmCalibrateSensorModal(this.state.sensorName, this.state.sensorId)}>{Locales.sensor.校正}</Button>
              </td>
            </tr>
            <tr style={{display: this.state.sensorStatus == 1 ? "" : "none"}}>
              <td colSpan={2} style={{textAlign: "center"}}>
                <Button className="btn" style={{textAlign: "center", fontSize: "18px", width: "300px"}}
                        onClick={()=>this.handleOpenConfirmDisableSensorModal(this.state.sensorName, this.state.sensorId)}>{Locales.sensor.故障}</Button>
              </td>
            </tr>
          </tbody>
         </table>
         <div className="confirmBtn">
           <Button onClick={this.handleCloseModifySensorModal}>{Locales.common.取消}</Button>
           <Button onClick={this.handleModifySensor}>{Locales.common.確認}</Button>
         </div>
      </Modal>
    );
  }

  buttonFormatter = (cell, row) => {
    return (
      <div>
        <Button onClick={() => this.handleOpenModifyGatewayModal(row.gateway_id, row.name, row.description)}>{Locales.common.修改}</Button>{" "}
        <Button className="btn btn-danger" onClick={()=>this.handleOpenConfirmDeleteGatewayModal(row)}>{Locales.common.刪除}</Button>
      </div>
    );
  }

  renderGatewayTab(modelType) {
    var height = (window.innerHeight - 230) + "px";
    const {SensorList_530,SensorList_472} =this.state;
    const statusList = [
      { value: "1", label: Locales.sensorStatus.Idle },
      { value: "3", label: Locales.sensorStatus.Malfunction },
      //{ value: "4", label: Locales.sensorStatus.Delete },
      { value: "11", label: Locales.sensorStatus.Online },
      { value: "13", label: Locales.sensorStatus.Offline },
      { value: "14", label: Locales.sensorStatus.Pause }
    ];
    let viewWidth = window.innerWidth - 370;
    const columns = [
      {
        dataField: "status",
        text: Locales.sensor.狀態,
        sort: true,
        formatter: cell => statusList.find(opt => opt.value == cell)
        ? statusList.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  statusList
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100}px`
          };
        },
        style: {
          width:  `${viewWidth*10/100}px`
        }
      },
      {
        dataField: "name",
        text: Locales.sensor.名稱,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width:  `${viewWidth*25/100}px`
          };
        },
        style: {
          width: `${viewWidth*25/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "model_name",
        text: Locales.sensor.型號,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width:`${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "version",
        text: Locales.sensor.版本,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width:`${viewWidth*15/100}px`
        }
      },
      {
        dataField: "gateway_id",
        text: Locales.sensor.裝置編號,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width:  `${viewWidth*20/100}px`,
          wordWrap: "break-word",
          wordBreak:"break-all"
        }
      },
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
      <div style={{paddingTop: "20px"}}>
        { this.renderModifyGatewayModal(modelType) }
        <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
          <CompTable
            keyField="gateway_id"
            data={ modelType == "530" ? SensorList_530 : SensorList_472 }
            columns={columns}
            defaultSorted={defaultSorted}
          />
        </div>
      </div>
    );
  }

  buttonFormatterBy120 = (cell, row) => {
    return (
      <div>
        <Button onClick={() => this.handleOpenModifySensorModal(row)}>{Locales.common.修改}</Button>{" "}
        <Button className="btn btn-danger" onClick={()=>this.handleOpenConfirmDeleteSensorModal(row)}>{Locales.common.刪除}</Button>
      </div>
    );
  };

  renderTREK120Tab() {
    var height = (window.innerHeight - 230) + "px";
    const {SensorList_120} = this.state;
    const sensorTypes = [
      { value: "fixed", label: Locales.sensorType.Fixed },
      { value: "mobile", label:  Locales.sensorType.Mobile }
    ];
    const statusList = [
      { value: "1", label: Locales.sensorStatus.Idle },
      { value: "2", label: Locales.sensorStatus.OnCalibrating },
      { value: "3", label: Locales.sensorStatus.Malfunction },
      //{ value: "4", label: Locales.sensorStatus.Delete },
      { value: "10", label: Locales.sensorStatus.Backup },
      { value: "11", label: Locales.sensorStatus.Online },
      { value: "12", label: Locales.sensorStatus.Abnormal },
      { value: "15", label: Locales.sensorStatus.Mobile },
      { value: "17", label: Locales.sensorStatus.Initial }
    ];
    let  viewWidth = window.innerWidth - 370;
    const columns = [
      {
        dataField: "status",
        text: Locales.sensor.狀態,
        sort: true,
        formatter: cell => statusList.find(opt => opt.value == cell)
        ? statusList.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  statusList
        }),
        headerStyle: () => {
          return {
            width:`${viewWidth*10/100}px`
          };
        },
        style: {
          width:`${viewWidth*10/100}px`
        }
      },
      {
        dataField: "sensor_id",
        text: Locales.sensor.硬體ID,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-word",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "name",
        text: Locales.sensor.裝置名稱,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-word",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "gateway_id",
        text: Locales.sensor.版本,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width:`${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`
        }
      },
      {
        dataField: "sensor_type",
        text: Locales.sensor.裝置類型,
        sort: true,
        formatter: cell => sensorTypes.find(opt => opt.value == cell)
        ? sensorTypes.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  sensorTypes
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100}px`
          };
        },
        style: {
          width: `${viewWidth*10/100}px`
        }
      },
      {
        dataField: "freezer_name",
        text: Locales.sensor.冷凍櫃,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
          wordWrap: "break-word",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "",
        text: "",
        formatter:this.buttonFormatterBy120,
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
      <div style={{paddingTop: "20px"}}>
        { this.renderModifySensorModal("120") }
        <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
          <CompTable
            keyField="sensor_id"
            data={ SensorList_120 }
            columns={columns}
            defaultSorted={defaultSorted}
          />
        </div>
      </div>
    );
  }

  getFreezerName(freezerId) {
    for(let i=0 ; i<this.state.freezerList.length ; ++i) {
      if(this.state.freezerList[i].freezer_id == freezerId) {
        return this.state.freezerList[i].name;
      }
    }
    return "";
  }

  renderConfirmDeleteGatewayModal() {
    if(this.state.showConfirmDeleteGatewayModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.common.您確定刪除嗎.format( this.state.confirmDeleteGatewayName )}
            confirmCB={this.handleDeleteGateway}
            cancelCB={this.handleCloseConfirmDeleteGatewayModal}
          />
        </div>
      );
    }
  }

  renderConfirmDeleteSensorModal() {
    if(this.state.showConfirmDeleteSensorModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.common.您確定刪除嗎.format( this.state.confirmDeleteSensorName )}
            confirmCB={this.handleDeleteSensor}
            cancelCB={this.handleCloseConfirmDeleteSensorModal}
          />
        </div>
      );
    }
  }

  renderConfirmDeActivateSensorModal() {
    if(this.state.showConfirmDeActivateSensorModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.sensor.您確定解除啟用嗎.format( this.state.confirmDeActivateSensorName )}
            confirmCB={this.handleDeActivateSensor}
            cancelCB={this.handleCloseConfirmDeActivateSensorModal}
          />
        </div>
      );
    }
  }

  renderConfirmDisableSensorModal() {
    if(this.state.showConfirmDisableSensorModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.sensor.您確定設定為故障嗎.format( this.state.confirmDisableSensorName )}
            confirmCB={this.handleDisableSensor}
            cancelCB={this.handleCloseConfirmDisableSensorModal}
          />
        </div>
      );
    }
  }

  renderConfirmCalibrateSensorModal() {
    if(this.state.showConfirmCalibrateSensorModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.sensor.您確定設定為校正嗎.format( this.state.confirmCalibrateSensorName )}
            confirmCB={this.handleCalibrateSensor}
            cancelCB={this.handleCloseConfirmCalibrateSensorModal}
          />
        </div>
      );
    }
  }

  renderAlertDeleteSensorModal() {
    if(this.state.showAlertModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <AlertDialog
            content={this.state.showAlertModalContent}
            confirmCB={this.handleCloseAlertModal}
          />
        </div>
      );
    }
  }

  render() {
    const { store }=this.props;
    return (
      <BlockUi tag="div" className={this.state.blocking_sensor || this.state.blocking_gateway ? "BlockUI" : ""}
        blocking={this.state.blocking_sensor || this.state.blocking_gateway} message={Locales.common.加載中}>
        <div className="Subpage">
          <div className="WhiteBGSubpage">
            { this.renderConfirmDeleteGatewayModal() }
            { this.renderConfirmDeleteSensorModal() }
            { this.renderConfirmDeActivateSensorModal() }
            { this.renderConfirmDisableSensorModal() }
            { this.renderConfirmCalibrateSensorModal() }
            { this.renderAlertDeleteSensorModal() }
            <Tabs id="sensorBackendTabs" className="tabStyle" animation={false}>
              <Tab eventKey={"530"} title="TREK-530">
                { this.renderGatewayTab("530") }
              </Tab>
              <Tab eventKey={"472"} title="PWS-472">
                { this.renderGatewayTab("472") }
              </Tab>
              <Tab eventKey={"120"} title="TREK-120">
                { this.renderTREK120Tab() }
              </Tab>
            </Tabs>
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
export default connect(mapStateToProps, {  })(SensorSubpage);
