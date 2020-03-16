import React, { Component } from "react";
import { connect } from "react-redux";
import {} from "../actions";
import { Button } from "react-bootstrap";
import ConfirmDialog from '../components/confirm_dialog';
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import { apiRoleList, apiRoleAuthorityInfo, apiRoleUpdate, toCancelApi,
         apiRuleTemplateMonitorList, apiRuleTemplateList, apiRuleTemplateAlertList,
         apiRuleTemplateAlertUpdate, apiDefineList, apiDefineUpdate } from "../utils/api";
import { Locales } from "../lang/language";
import {  sortByKey } from "../utils/common";

class PermissionSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      selectedItem: {
        role_id: 0,
        role_name: "",
      },
      listData:[],
      temperatureData:[],
      batteryData:[],
      inspectData:[],
      alertRulesData:[],
      ruleTemplatesData:[],
      alertReservedData:[],
      temperatureAlertRulesData:[],
      batteryAlertRulesData:[],
      inspectAlertRulesData:[],
      freezerPauseRoleData:[],
      sensorDisableRoleData:[],
      isInit:false
    };
     this.getRoleList();
     this.getRuleTemplateMonitorList();
  }

  componentWillUnmount(){
    toCancelApi();
  }

  handleOpenModal = selectedItem => {
    this.getRoleAuthorityInfo(selectedItem.role_id)
  };
  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  getRuleTemplateMonitorList = (isSetRole, notices) => {
    const {token} = this.props;
    // get Role Template Monitor list
    apiRuleTemplateMonitorList({acc_id: this.props.user.acc_id, token})
    .then(function(response) {
      const temperatureData = response.data.monitor_rules.filter(x=>x.item=="temperature" );
      const batteryData = response.data.monitor_rules.filter(x=>x.item=="battery");
      const inspectData = response.data.monitor_rules.filter(x=>x.item=="inspect");
      this.setState({
        temperatureData, batteryData, inspectData
      });
      this.getRuleTemplateList(isSetRole, notices);
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getRuleTemplateList = (isSetRole,notices) => {
    const {token} = this.props;
    // get Role Template list
    apiRuleTemplateList({acc_id: this.props.user.acc_id, token})
    .then(function(response) {
      this.setState({
        ruleTemplatesData: response.data.rule_templates.filter(x=> x.alert_rule_id.indexOf("sys_") == -1)
      });
      this.getRuleTemplateAlertList(isSetRole, notices);
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getRuleTemplateAlertList = (isSetRole, notices) => {
    const {token} = this.props;
    // get Role Template Alert list
    apiRuleTemplateAlertList({acc_id: this.props.user.acc_id, token})
    .then(function(response) {
      this.getAlertReservedList(isSetRole,notices);
      this.setState({
        alertRulesData: response.data.alert_rules.filter(x=> x.alert_rule_id.indexOf("sys_") == -1)
      });
      const temperatureAlertRulesData = this.getAlertRulesForType("temperature");
      const batteryAlertRulesData = this.getAlertRulesForType("battery");
      const inspectAlertRulesData = this.getAlertRulesForType("inspect");
      this.setState({
        temperatureAlertRulesData: temperatureAlertRulesData,
        batteryAlertRulesData: batteryAlertRulesData,
        inspectAlertRulesData: inspectAlertRulesData,
      });
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getAlertReservedList = (isSetRole, notices) => {
    const {token} = this.props;
    // get Role Template Alert list
    apiDefineList({type: "AlertReserved", token})
    .then(function(response) {
      const data = response.data.defines.filter(x=> x.id.indexOf("sys_") == -1)
      const freezerPauseRoleData = data.filter(x=> x.state_machine.require.target == "freezer" && x.state_machine.require.value == "pause");
      const sensorDisableRoleData = data.filter(x=> x.state_machine.require.target == "sensor" && x.state_machine.require.value == "disable");
      this.setState({
        alertReservedData: data,
        freezerPauseRoleData,
        sensorDisableRoleData,
        isInit: true
      });
      if(isSetRole){
        this.setAlertRole(notices);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getRoleList = () => {
    const {token} = this.props;
    // get Role list
    apiRoleList(token)
    .then(function(response) {
      
      this.setState({ listData: sortByKey(response.data.rolelist, "role_name") });
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getRoleAuthorityInfo = (role_id) => {
    const {token} = this.props;
    apiRoleAuthorityInfo({token, role_id})
    .then(function(response) {
      this.setState({ showModal: true, selectedItem: response.data.role });
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setAlertRole = (notices) => {
    const {temperatureData, batteryData, inspectData, alertReservedData} = this.state;
    if(temperatureData.length == 0  && batteryData.length == 0  && inspectData.length == 0 && alertReservedData.length == 0 ) {
      this.getRuleTemplateMonitorList(true, notices);
      return;
    }
    this.setAlertRulesForType("temperature");
    this.setAlertRulesForType("battery");
    this.setAlertRulesForType("inspect");
    this.setAlertReservedForType("freezer");
    this.setAlertReservedForType("sensor");
  }

  getAlertRulesForType = (type) => {
    const {temperatureData, batteryData, inspectData, ruleTemplatesData, alertRulesData} = this.state;
    let data = [];
    switch(type){
      case "temperature":
        data = temperatureData;
        break;
      case "battery":
        data = batteryData;
        break;
      case "inspect":
        data = inspectData;
        break;
    }
    const monitorRuleID = data.map(x=> x.monitor_rule_id);
    const templatesData = ruleTemplatesData.filter(x=> monitorRuleID.indexOf(x.monitor_rule_id) > -1 && x.alert_rule_id.indexOf("sys_") == -1).map(x=>x.alert_rule_id);
    const alertRulesResultData = alertRulesData.filter(x=> templatesData.indexOf(x.alert_rule_id) > -1 );
    return alertRulesResultData;
  }

  setAlertRulesForType = (type)=>{
    const {listData} = this.state;
    let page_id = "";
    switch(type){
      case "temperature":
        page_id = "Temperature";
        break;
      case "battery":
        page_id = "Power";
        break;
      case "inspect":
        page_id = "InspectionTimeout";
        break;
    }
    const alertRulesResultData =this.getAlertRulesForType(type);
    const result = listData.filter(x=>x.auth_info.notice && x.auth_info.notice.filter(y=>y.page_id == page_id && y.auth.length > 0 && y.auth[0] == "read").length > 0).map(x=>x.role_name);
    for ( let item of alertRulesResultData ) {
      item.recv_roles = result;
      this.setRuleTemplateAlertUpdate(item);
    }
    return alertRulesResultData;
  }

  setAlertReservedForType(type) {
    const {alertReservedData, listData} = this.state;
    let page_id = "";
    switch(type) {
      case "sensor":
        page_id = "TemperatureMeasuringDevice";
        break;
      case "freezer":
        page_id = "ControlGreenhouse";
        break;
    }
    const result = listData.filter(x=>x.auth_info.notice && x.auth_info.notice.filter(y=>y.page_id == page_id &&  y.auth.length > 0 &&  y.auth[0] == "read").length > 0).map(x=>x.role_name);
    let data = alertReservedData.find(x=>x.state_machine.require.target == type && x.id.indexOf("sys_") == -1);
    data.state_machine.entry_action.target = result;
    this.setAlertReservedUpdate(data);
  }

  setRuleTemplateAlertUpdate = (alert_rule) => {
    const {token} = this.props;
    apiRuleTemplateAlertUpdate({token, alert_rule})
    .then(function(response) {
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setAlertReservedUpdate = (alertReserved) => {
    const {token}=this.props;
    apiDefineUpdate({token, type: "AlertReserved", code: alertReserved.code, id: alertReserved.id, name: alertReserved.name, state_machine: alertReserved.state_machine})
    .then(function(response) {
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setRoleAuthorityInfo = (role) => {
    const {token} = this.props;
    apiRoleUpdate({token, role_id: role.role_id, auth_info: role.auth_info})
    .then(function(response) {
      this.setAlertRole(role.notices);
      this.getRoleList();
      this.getRuleTemplateMonitorList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  render() {
    const { listData, temperatureAlertRulesData, batteryAlertRulesData,
            inspectAlertRulesData, freezerPauseRoleData, sensorDisableRoleData, isInit} = this.state;
    var height = window.innerHeight - 160 + "px";
    let viewWidth = window.innerWidth - 420;
    return (
      <div className="Subpage">
        <div className="WhiteBGSubpage">
          {/* <Button onClick={this.handleOpenModal} >新增角色</Button> */}
          <RoleModal
            showModal={this.state.showModal}
            selectedItem={this.state.selectedItem}
            handleCloseModal={this.handleCloseModal}
            saveModal={this.setRoleAuthorityInfo}
            temperatureAlertData={temperatureAlertRulesData}
            powerRoleData={batteryAlertRulesData}
            inspectionRoleData={inspectAlertRulesData}
            freezerPauseRoleData={freezerPauseRoleData}
            sensorDisableRoleData={sensorDisableRoleData}
          />
          {isInit && (temperatureAlertRulesData.length == 0 || batteryAlertRulesData.length == 0 || inspectAlertRulesData.length == 0 || freezerPauseRoleData.length == 0 || sensorDisableRoleData.length == 0) &&
            <ConfirmDialog content={" 訂義異常(缺少) "} />
          }
          <div style={{ paddingTop: "10px", height: height, overflow: "auto" }} className="CompTable">
            <table style={{ width: "100%", textAlign: "center" }}>
              <tbody>
                <tr className="rowDataHeader">
                  <td width={`${viewWidth*40/100}px`}>{Locales.permission.名稱}</td>
                  <td width={`${viewWidth*30/100}px`}>{Locales.permission.備註}</td>
                  <td width={`${viewWidth*20/100}px`}>{Locales.permission.關聯帳號數}</td>
                  <td width={`${viewWidth*10/100+25}px`} />
                </tr>
              </tbody>
              <tbody style={{ maxHeight: (window.innerHeight - 250 + "px")}} >
                <FreezerData
                  handleOpenModal={this.handleOpenModal}
                  handleCloseModal={this.handleCloseModal}
                  listData={listData}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

class RoleModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      selectedItem: props.selectedItem,
      noticeSource: [
        { value: "Temperature", label: Locales.permission.溫度異常 },
        { value: "Power", label: Locales.permission.電量異常 },
        { value: "ControlGreenhouse", label: Locales.permission.冰箱控溫室暫停使用 },
        { value: "TemperatureMeasuringDevice", label: Locales.permission.測溫裝置故障 },
        { value: "InspectionTimeout", label: Locales.permission.巡檢逾時通知 }
      ],
      webSource: [
        { value: "Setting", label: Locales.permission.web.設定 },
        { value: "CalibrationRecord", label: Locales.permission.web.校正紀錄 },
        { value: "ReportExport", label: Locales.permission.web.報表匯出 },
        { value: "WatchData", label: Locales.permission.web.瀏覽數據 },
        { value: "InputExceptionRecord", label: Locales.permission.web.輸入異常紀錄 },
        { value: "OperatingDeviceStatus", label: Locales.permission.web.裝置狀態操作 }
      ],
      appSource: [
        { value: "WatchData", label: Locales.permission.app.瀏覽數據 },
        { value: "InputExceptionRecord", label: Locales.permission.app.輸入異常紀錄 },
        { value: "OperatingDeviceStatus", label: Locales.permission.app.裝置狀態操作 }
      ],
      temperatureAssistantSource: [{ value: "All", label: Locales.permission.全功能 }],
      overviewSource: [{ value: "Web", label: Locales.permission.overview.網頁 },{ value: "App", label: Locales.permission.overview.手機 }],
      transportSource: [{ value: "Transport", label: Locales.permission.運輸 }],
      role_id:0,
      name: "",
      note: "",
      notices: [],
      webs: [],
      apps: [],
      temperatureAssistant: [],
      overview: [],
      transport: [],
      temperatureAlertData: props.temperatureAlertData,
      powerRoleData: props.powerRoleData,
      inspectionRoleData: props.inspectionRoleData,
      freezerPauseRoleData: props.freezerPauseRoleData,
      sensorDisableRoleData: props.sensorDisableRoleData,
      isChange:false
    };
    this.save = this.save.bind(this);
    this.handleNoticesChange = this.handleNoticesChange.bind(this);
    this.handleWebChange = this.handleWebChange.bind(this);
    this.handleAppChange = this.handleAppChange.bind(this);
    this.handleTemperatureAssistantChange = this.handleTemperatureAssistantChange.bind(
      this
    );
    this.handleOverviewChange = this.handleOverviewChange.bind(this);
    this.handleTransportChange = this.handleTransportChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    let data = this.initData();
    if(nextProps.selectedItem) {
      const oData = nextProps.selectedItem;
      if(oData.auth_info) {
        const jsonData = oData.auth_info;
        if( Array.isArray(jsonData.app_3) ) {
          data.apps = jsonData.app_3.filter(x=>x.auth.length > 0).map(x=> x.page_id);
        }
        if( Array.isArray(jsonData.notice) ) {
          data.notices = jsonData.notice.filter(x=>x.auth.length > 0).map(x=> x.page_id);
        }
        if(  Array.isArray(jsonData.webpage) ) {
          data.webs = jsonData.webpage.filter(x=>x.auth.length > 0).map(x=> x.page_id);
        }
        if( Array.isArray(jsonData.temp_assist) ) {
          data.temperatureAssistant =jsonData.temp_assist.filter(x=>x.auth.length > 0).map(x=> x.page_id);
        }
        if( Array.isArray(jsonData.config_tool) ) {
          data.overview =jsonData.config_tool.filter(x=>x.auth.length > 0).map(x=> x.page_id);
        }
        if( Array.isArray(jsonData.transport) ) {
          data.transport = jsonData.transport.filter(x=>x.auth.length > 0).map(x=> x.page_id);
        }
      }
      data.name = oData.role_name;
      data.role_id = oData.role_id;
      data.note = oData.note;
    }
    this.setState({
      name: data.name,
      note: data.note,
      role_id: data.role_id,
      apps: data.apps,
      notices: data.notices,
      webs: data.webs,
      temperatureAssistant: data.temperatureAssistant,
      overview: data.overview,
      transport: data.transport,
      temperatureAlertData: nextProps.temperatureAlertData,
      powerRoleData: nextProps.powerRoleData,
      inspectionRoleData: nextProps.inspectionRoleData,
      freezerPauseRoleData: nextProps.freezerPauseRoleData,
      sensorDisableRoleData: nextProps.sensorDisableRoleData,
    });
  }

  initData() {
    const data = {
      role_id: 0,
      name: "",
      note: "",
      notices: [],
      webs: [],
      apps: [],
      temperatureAssistant: [],
      overview: [],
      transport: []
    };
    return data;
  }

  handleNoticesChange(e) {
    const item = e.target.value;
    const isChecked = e.target.checked;
    let {name, temperatureAlertData, powerRoleData, inspectionRoleData, freezerPauseRoleData, sensorDisableRoleData} = this.state;
    let notices = this.state.notices;
    let recv_roles = [];
    let data = []
    let isalertRole = false;
    switch(item) {
      case "Temperature":
        data = temperatureAlertData;
        isalertRole = true;
        break;
      case "Power":
        data = powerRoleData;
        isalertRole = true;
        break;
      case "InspectionTimeout":
        data = inspectionRoleData;
        isalertRole = true;
        break;
      case "ControlGreenhouse":
        data = freezerPauseRoleData;
        break;
      case "TemperatureMeasuringDevice":
        data = sensorDisableRoleData;
        break;
    }
    if(isChecked) {
      notices.push(item);
      if(isalertRole) {
        data .forEach(element => {
          element.recv_roles.indexOf(name) == -1 ?element.recv_roles.push(name):recv_roles
        });
      } else {
        data.forEach(element => {
          element.state_machine.entry_action.target.indexOf(name) == -1 ?element.state_machine.entry_action.target.push(name):recv_roles
        });
      }
    } else {
      let index = notices.indexOf(item);
      if(index !== -1) { notices.splice(index, 1); }
      if(isalertRole) {
        data .forEach(element => {
          var index = element.recv_roles.indexOf(name);
          if (index > -1) {
            element.recv_roles.splice(index, 1);
          }
        });
      } else {
        data.forEach(element => {
          var index = element.state_machine.entry_action.target.indexOf(name);
          if (index > -1) {
            element.state_machine.entry_action.target.splice(index, 1);
          }
        });
      }
    }
    switch(item) {
      case "Temperature":
        temperatureAlertData = data;
        break;
      case "Power":
        powerRoleData = data;
        break;
      case "InspectionTimeout":
        inspectionRoleData = data;
        break;
      case "ControlGreenhouse":
        freezerPauseRoleData = data;
        break;
      case "TemperatureMeasuringDevice":
        sensorDisableRoleData = data;
        break;
    }
    this.setState({ notices, isChange: true, temperatureAlertData, powerRoleData,
                    inspectionRoleData, freezerPauseRoleData, sensorDisableRoleData});
  }

  handleWebChange(e) {
    const item = e.target.value;
    const isChecked = e.target.checked;
    let webs = this.state.webs;
    if (isChecked) {
      webs.push(item);
    } else {
      let index = webs.indexOf(item);
      if(index !== -1) { webs.splice(index, 1); }
    }
    this.setState({ webs });
  }

  handleAppChange(e) {
    const item = e.target.value;
    const isChecked = e.target.checked;
    let apps = this.state.apps;
    if (isChecked) {
      apps.push(item);
    } else {
      let index = apps.indexOf(item);
      if (index !== -1) { apps.splice(index, 1); }
    }
    this.setState({ apps });
  }

  handleTemperatureAssistantChange(e) {
    const item = e.target.value;
    const isChecked = e.target.checked;
    let temperatureAssistant = this.state.temperatureAssistant;
    if (isChecked) {
      temperatureAssistant.push(item);
    } else {
      let index = temperatureAssistant.indexOf(item);
      if (index !== -1) { temperatureAssistant.splice(index, 1); }
    }
    this.setState({ temperatureAssistant });
  }

  handleOverviewChange(e) {
    const item = e.target.value;
    const isChecked = e.target.checked;
    let overview = this.state.overview;
    if (isChecked) {
      overview.push(item);
    } else {
      let index = overview.indexOf(item);
      if (index !== -1) { overview.splice(index, 1); }
    }
    this.setState({ overview });
  }

  handleTransportChange(e) {
    const item = e.target.value;
    const isChecked = e.target.checked;
    let transport = this.state.transport;
    if (isChecked) {
      transport.push(item);
    } else {
      let index = transport.indexOf(item);
      if (index !== -1) { transport.splice(index, 1); }
    }
    this.setState({ transport });
  }

  checkAlertCount(type) {
    const { temperatureAlertData, powerRoleData, inspectionRoleData, freezerPauseRoleData,
            sensorDisableRoleData, name, isChange } = this.state
    let alertData = [];
    let isAlertRole = false;
    switch(type) {
      case "Temperature":
        alertData = temperatureAlertData;
        isAlertRole = true;
        break;
      case "Power":
        alertData = powerRoleData;
        isAlertRole = true;
        break;
      case "InspectionTimeout":
        alertData = inspectionRoleData;
        isAlertRole = true;
        break;
      case "ControlGreenhouse":
        alertData = freezerPauseRoleData;
        break;
      case "TemperatureMeasuringDevice":
        alertData = sensorDisableRoleData;
        break;
    }
    let haveRoleAlertData = [];
    if(isAlertRole) {
      haveRoleAlertData = alertData.filter(x=>x.recv_roles.indexOf(name) > -1);
    } else {
      haveRoleAlertData = alertData.filter(x=>x.state_machine.entry_action.target.indexOf(name) > -1);
    }
    return haveRoleAlertData.length > 0 && haveRoleAlertData.length != alertData.length;
  }

  save() {
    const {
      appSource,
      webSource,
      noticeSource,
      temperatureAssistantSource,
      overviewSource,
      transportSource,
      webs,
      notices,
      apps,
      role_id,
      name,
      note,
      temperatureAssistant,
      overview,
      transport
    } = this.state;
    let result = {
      role_id,
      note,
      notices,
      auth_info:{
        notice: noticeSource.map(notice => ({
          page_id: notice.value,
          page_name: notice.label,
          auth: notices.indexOf(notice.value) >= 0 ? ["read"] : []
        })),
        webpage: webSource.map(web => ({
          page_id: web.value,
          page_name: web.label,
          auth: webs.indexOf(web.value) >= 0 ? ["read"] : []
        })),
        app_3: appSource.map(app => ({
          page_id: app.value,
          page_name: app.label,
          auth: apps.indexOf(app.value) >= 0 ? ["read"] : []
        })),
        temp_assist: temperatureAssistantSource.map(t => ({
          page_id: t.value,
          page_name: t.label,
          auth: temperatureAssistant.indexOf(t.value) >= 0 ? ["read"] : []
        })),
        config_tool: overviewSource.map(o => ({
          page_id: o.value,
          page_name: o.label,
          auth: overview.indexOf(o.value) >= 0 ? ["read"] : []
        })),
        transport: transportSource.map(t => ({
          page_id: t.value,
          page_name: t.label,
          auth: transport.indexOf(t.value) >= 0 ? ["read"] : []
        }))
      }
    };
    this.props.saveModal(result)
    this.props.handleCloseModal();
  }
  render() {
    const props = this.props;
    const {
      name,
      note,
      notices,
      webs,
      apps,
      appSource,
      webSource,
      noticeSource,
      temperatureAssistantSource,
      overviewSource,
      transportSource,
      temperatureAssistant,
      overview,
      transport
    } = this.state;
    let title = Locales.permission.新增角色;
    if (name !== undefined && name != "") {
      title = Locales.permission.修改角色;
    }
    return (
      <SettingTemplateDialog
        isOpen={props.showModal}
        cancelCB={props.handleCloseModal}
        confirmCB={this.save}
        shouldCloseOnOverlayClick={true}
        modalTitle={title}
        width="600px"
        height="645px" >
        <table width="100%" className="CorrectSubpageTable SetDataTable " >
          <tbody>
            <tr>
              <td width="25%">{Locales.permission.名稱}</td>
              <td>
                <input
                  type="text"
                  className="InputStyle"
                  defaultValue={name}
                  readOnly
                  onChange={e => this.setState({ name: e.target.value })}
                />
              </td>
            </tr>
            {/* <tr>
              <td>{Locales.permission.備註}</td>
              <td>
                <input
                  type="text"
                  className="InputStyle"
                  defaultValue={note}
                  onChange={e => this.setState({ note: e.target.value })}
                />
              </td>
            </tr> */}
            <tr>
              <td>{Locales.permission.通知}</td>
              <td>
                <label className="checkbox-inline" style={{ padding: "0px" }} />
                {noticeSource.map((item, index) => {
                  return (
                    <label className="checkbox-inline" key={index}>
                      <input
                        key={index}
                        type="checkbox"
                        name="notice"
                        checked={notices.indexOf(item.value) > -1}
                        ref={elem => elem && (elem.indeterminate = this.checkAlertCount(item.value))}
                        value={item.value}
                        onChange={this.handleNoticesChange}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr>
            <tr>
              <td>{Locales.permission.web.網頁功能}</td>
              <td>
                <label className="checkbox-inline" style={{ padding: "0px" }} />
                {webSource.map((item, index) => {
                  return (
                    <label className="checkbox-inline" key={index}>
                      <input
                        key={index}
                        type="checkbox"
                        name="notice"
                        checked={webs.indexOf(item.value) > -1}
                        value={item.value}
                        onChange={this.handleWebChange}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr>
            <tr>
              <td>{Locales.permission.app.行動冷鏈APP}</td>
              <td>
                <label className="checkbox-inline" style={{ padding: "0px" }} />
                {appSource.map((item, index) => {
                  return (
                    <label className="checkbox-inline" key={index}>
                      <input
                        key={index}
                        type="checkbox"
                        name="notice"
                        checked={apps.indexOf(item.value) > -1}
                        value={item.value}
                        onChange={this.handleAppChange}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr>
            <tr>
              <td>{Locales.permission.測溫助理}</td>
              <td>
                <label className="checkbox-inline" style={{ padding: "0px" }} />
                {temperatureAssistantSource.map((item, index) => {
                  return (
                    <label className="checkbox-inline" key={index}>
                      <input
                        key={index}
                        type="checkbox"
                        name="notice"
                        checked={temperatureAssistant.indexOf(item.value) > -1}
                        value={item.value}
                        onChange={this.handleTemperatureAssistantChange}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr>
            <tr>
              <td>{Locales.permission.overview.Overview}</td>
              <td>
                <label className="checkbox-inline" style={{ padding: "0px" }} />
                {overviewSource.map((item, index) => {
                  return (
                    <label className="checkbox-inline" key={index}>
                      <input
                        key={index}
                        type="checkbox"
                        name="notice"
                        checked={overview.indexOf(item.value) > -1}
                        value={item.value}
                        onChange={this.handleOverviewChange}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr>
            {/* <tr>
              <td>{Locales.permission.運輸}</td>
              <td>
                <label className="checkbox-inline" style={{ padding: "0px" }} />
                {transportSource.map((item, index) => {
                  return (
                    <label className="checkbox-inline" key={index}>
                      <input
                        key={index}
                        type="checkbox"
                        name="notice"
                        checked={transport.indexOf(item.value) > -1}
                        value={item.value}
                        onChange={this.handleTransportChange}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr> */}
          </tbody>
        </table>
      </SettingTemplateDialog>
    );
  }
}

function FreezerData(props) {
  let viewWidth = window.innerWidth - 420;
  return _.map(props.listData, data => {
    return (
      <tr key={Math.random()} className="rowDataContent">
        <td width={`${viewWidth*40/100}px`}>{data.role_name} ({data.role_id})</td>
        <td width={`${viewWidth*30/100}px`}>{data.note}</td>
        <td width={`${viewWidth*20/100}px`}>{data.accountCount}</td>
        <td width={`${viewWidth*10/100+25}px`} className="tableBtnRow">
          <Button onClick={props.handleOpenModal.bind(this, data)} >
            {Locales.common.修改}
          </Button>
          {/* <Button >刪除</Button> */}
        </td>
      </tr>
    );
  });
}

function mapStateToProps({ store,token,user }, ownProps) {
  return { store ,token,user};
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(PermissionSubpage);
