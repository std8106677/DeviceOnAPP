import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { apiRuleTemplateMonitorList, apiRuleTemplateList, apiRuleTemplateAdd,
         apiRuleTemplateUpdate, apiRuleTemplateDelete, toCancelApi,
         apiRuleTemplateAlertList, apiRuleTemplateMonitorAdd } from "../utils/api";
import { Button, FormGroup, FormControl, ControlLabel, Dropdowns, MenuItem } from "react-bootstrap";
import Select , { createFilter } from 'react-select';
import Modal from '../components/settingTemplate_dialog';
import ConfirmDialog from "../components/confirm_dialog";
import { sortByKey } from "../utils/common";
import { Locales } from "../lang/language";

const customStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '200px',
    left: 'calc(50% - 280px)',
    right: '0px',
    bottom: '0px',
    width: '570px',
    height: '450px',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};

class ElecAlertSubpage extends Component {
  constructor(props) {
    super(props);
    this.token = this.props.token;
    this.user = this.props.user;
    this.dropdownTempMonitor=[];
    this.setDefaultAlertRuleID();
    this.state = {
      templateList: [],
      selTemplate: {
        alert_rule_id: "sys_battery",
        code: "",
        monitor_rule_id: "",
        name: "",
        rule_template_id: ""
      },
      selTempMonitor: 10,/*{
            interval: 10,
            item: "battery",
            lower_limit: -999,
            monitor_rule_id: "",
            name: "",
            upper_limit: 999},*/
      showModal: false,
      isModify: false,
      showConfirmModal: false,
      alertContent: "",
      checkData: false,
      alert_rule_id: "t"
    };
  }

  componentWillUnmount() {
    toCancelApi();
  }

  setDefaultAlertRuleID = () => {
    const {token} = this.props;
    // get Role Template Alert list
    apiRuleTemplateAlertList({acc_id:this.props.user.acc_id,token})
    .then(
      function(response) {
        const alertRulesData = response.data.alert_rules.filter(x=>  x.alert_rule_id.indexOf("sys_") == -1 && x.name.indexOf("Battery Custom") > -1);
        let alert_rule_id = alertRulesData.length > 0 ? alertRulesData[0].alert_rule_id : "";
        let {selTemplate} = this.state;
        selTemplate.alert_rule_id = alert_rule_id,
        this.setState({
          selTemplate,
          alert_rule_id: alert_rule_id
        });
        this.doGetMonitorList();
        this.doGetTemplateList();
      }.bind(this)
    )
    .catch(function(error) {
      console.log(error);
    });
  }

  handleOpenModal = (e, data) => {
    this.setState({ showModal: true });
    let {template, selTempMonitor, isModify} = data;
    //console.log("template:",template,", selTempMonitor:",selTempMonitor,", isModify:",isModify);
    this.setState({ selTemplate: template });
    this.setState({ selTempMonitor: selTempMonitor});
    this.setState({ isModify: isModify });
    this.setState({ showModal: true });
  }

  handleCloseModal = () => {
    this.setState({ showModal: false });
    this.setState({ alertContent: "" });
    this.setState({ checkData: false });
  }

  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false });
    this.setState({ alertContent: "" });
  }

  handelConfirmDeleted = () => {
    let id = this.state.selTemplate.rule_template_id;
    //console.log("Delete result id:",id," type:",this.state.delType);
    this.doDelteteTemplate(id);
    this.setState({ showConfirmModal: false });
    this.setState({ alertContent: "" });
  }

  handelDeleteItem = (e, template) => {
    //if (window.confirm('Are you sure you wish to delete this item?')) {
    this.setState({selTemplate: template});
    this.setState({alertContent: Locales.elecAlert.確定刪除警示群組嗎.format("["+template.name+"]")});
    this.setState({showConfirmModal: true});
  }

  handleItemChanged = (e,type) => {
    switch (type) {
      case "template":
        this.setState({ selTemplate: {
          alert_rule_id: this.state.alert_rule_id,
          code: this.state.selTemplate.code,
          monitor_rule_id: this.state.selTemplate.monitor_rule_id,
          name: e.target.value,
          rule_template_id: this.state.selTemplate.rule_template_id}
        });
        //console.log("template name:",e.target.value);
        if(e.target.value.trim() != "") { this.setState({alertContent:""}); }
        break;
      case "monitor":
        //console.log("e.value",e.value);
        var condition = this.dropdownTempMonitor.filter(con => {
          return (con.lower_limit == e.value);
        });
        let monitor_rule_id = "";
        if(condition.length > 0){
          monitor_rule_id = condition[0].monitor_rule_id;
        }
        //console.log("condition:",condition);
        this.setState({ selTempMonitor: e.value });
        this.setState({ selTemplate: {
          alert_rule_id:this.state.alert_rule_id,
          code:this.state.selTemplate.code,
          monitor_rule_id:monitor_rule_id,
          name:this.state.selTemplate.name,
          rule_template_id:this.state.selTemplate.rule_template_id}
        });
        //console.log("select TempMonitor:",condition[0]);
        break;
    }
  }

  handelAddNewItem = async (e) => {
    let reqData={};
    if( this.state.selTemplate.name.trim() == "" ) {
      this.setState({alertContent:Locales.elecAlert.請輸入警示群組名稱});
      this.setState({checkData:true});
    } else {
      let monitor_rule_id = "";
      if(this.state.selTemplate.monitor_rule_id == "") {
        var condition = this.dropdownTempMonitor.filter(con => {
          return (con.lower_limit == this.state.selTempMonitor);
        });
        if(condition.length > 0) {
          monitor_rule_id = condition[0].monitor_rule_id;
        } else {
          monitor_rule_id = await this.doAddMonitorItem(this.state.selTempMonitor);
          this.doGetMonitorList();
        }
        //console.log("monitor_rule_id:",monitor_rule_id);
      } else {
        monitor_rule_id = this.state.selTemplate.monitor_rule_id;
      }
      if(this.state.isModify) {
        let item = this.state.selTemplate;
        reqData = {
          rule_template:{
            alert_rule_id:this.state.alert_rule_id,
            code:this.state.selTemplate.code,
            monitor_rule_id:monitor_rule_id,
            name:this.state.selTemplate.name,
            rule_template_id:this.state.selTemplate.rule_template_id
          },
          token:this.token
        };
        //console.log("Modify template:",reqData);
        this.doModifyTemplate(reqData);
      } else {
        let maxCode = getMaxCode(this.state.templateList);
        let code = parseInt(maxCode,10) + 1;
        reqData = {
          rule_template:{
            alert_rule_id: this.state.alert_rule_id,
            code: code,
            monitor_rule_id: monitor_rule_id,
            name: this.state.selTemplate.name
          },
          token: this.token
        };
        //console.log("Add template:",reqData);
        this.doAddTemplate(reqData)
      }
      this.setState({ showModal: false });
      this.setState({ alertContent: "" });
      this.setState({ checkData: false });
    }
  }

  doGetMonitorList = () => {
    let data = {acc_id:this.user.acc_id,token:this.token};
    apiRuleTemplateMonitorList(data)
    .then(function(response) {
      if(response.data.status == 1) {
        let monitor = response.data.monitor_rules;
        sortByKey(monitor,"name",false,true,false);
        _.map(monitor, list=>{
          if(list.item == "battery"){
            this.dropdownTempMonitor.push(list);
          }
        });
        //this.setState({selTempMonitor:this.dropdownTempMonitor[0]});
        //console.log("dropdownTempMonitor",this.dropdownTempMonitor)
      } else {
        console.log("Get MonitorList error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  doAddMonitorItem = async (lowerlimit) => {
    let monitor_rule = {
      code: lowerlimit,
      name: lowerlimit+"%",
      item: "battery",
      lower_limit: lowerlimit,
      upper_limit: 100
    };
    let data = {monitor_rule:monitor_rule,token:this.token};
    let response = await apiRuleTemplateMonitorAdd(data)
    if(response.data.status == 1) {
      let monitorRuleId = response.data.monitor_rule_id;
      return monitorRuleId;
    } else {
      console.log("doAddMonitorItem response error:",response.data);
      return "";
    }
  }

  doGetTemplateList = () => {
    let data = {acc_id:this.user.acc_id,token:this.token};
    let list = [];
    apiRuleTemplateList(data)
    .then(async function(response) {
      if(response.data.status == 1) {
        let template = response.data.rule_templates;
        sortByKey(template, "name", false, false, false);
        _.map(template,temp=>{
          if(temp.code == "Carrefour_Battery_Default"){// || temp.alert_rule_id == this.state.alert_rule_id
            list.push(temp);
          }
        });
        this.setState({templateList:list});
        if(list.length == 0) {
          console.log("Add default elect alert!");
          console.log("this.state.alert_rule_id:",this.state.alert_rule_id);
          let monitor_rule_id = await this.doAddMonitorItem(10);
          this.doGetMonitorList();
          let reqData = {
            rule_template:{
              alert_rule_id:this.state.alert_rule_id,
              code:"Carrefour_Battery_Default",
              monitor_rule_id:monitor_rule_id,
              name:Locales.common.預設
            },
            token:this.token
          };
          //console.log("Add template:",reqData);
          this.doAddTemplate(reqData)
        }
        //console.log("rule template",list)
      } else {
        console.log("Get rule template error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  doAddTemplate = (reqData) => {
    apiRuleTemplateAdd(reqData)
    .then(function(response){
      if(response.data.status == 1) {
        this.doGetTemplateList();
      } else {
        console.log("Add rule template error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  doModifyTemplate = (reqData) => {
    apiRuleTemplateUpdate(reqData)
    .then(function(response) {
      if(response.data.status == 1) {
        this.doGetTemplateList();
      } else {
        console.log("Modify rule template error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  doDelteteTemplate = (id) => {
    apiRuleTemplateDelete({id:id,token:this.token})
    .then(function (response) {
      if(response.data.status == 1) {
        this.doGetTemplateList();
      } else {
        console.log("template delete error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  renderConfirmDialog() {
    if(this.state.showConfirmModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={this.state.alertContent}
            confirmCB={this.handelConfirmDeleted}
            cancelCB={this.handleCloseConfirmModal}
          />
        </div>
      );
    }
  }

  render() {
    const { store } = this.props;
    var height = window.innerHeight - 200;
    let  viewWidth = window.innerWidth - 400;
    return (
      <div className="Subpage">
        { this.renderConfirmDialog() }
        <div className="WhiteBGSubpage">
          <Button style={{float:"right",marginRight:"30px",cursor:"pointer", marginBottom:"5px", visibility:"hidden"}}
                  onClick={e=>this.handleOpenModal(e,{template:{alert_rule_id:"sys_battery", code:"", monitor_rule_id:"", name:"", rule_template_id:""}, selTempMonitor:10,isModify:false})}>
            {Locales.elecAlert.新增警示群組}
          </Button>
          <AddAlertGroupModal
            showModal={this.state.showModal}
            onCloseModal={this.handleCloseModal}
            onAddItemClick={this.handelAddNewItem}
            onValueChanged={this.handleItemChanged}
            tempMenuItems={this.dropdownTempMonitor}
            alertContent={this.state.alertContent}
            selTempMonitor={this.state.selTempMonitor}
            selTemplate={this.state.selTemplate}
            checkData={this.state.checkData}
          />
            {this.state.alert_rule_id == "" &&  <ConfirmDialog
              content={"Battery Custom does not exist  in the rule_template Alert list "}
            />}
          <div style={{width: "98%", height: height-19+"px", overflow: "auto", overflowX: "hidden", margin: "1%"}} className="CompTable">
            <table style={{width:"100%", textAlign: "center"}}>
              <tbody>
                <tr className="rowDataHeader">
                  <td width={`${viewWidth*50/100}px`}>{Locales.elecAlert.警示群組名稱}</td>
                  <td width={`${viewWidth*30/100}px`}>{Locales.elecAlert.低電量條件}</td>
                  <td width={`${viewWidth*20/100+25}px`}></td>
                </tr>
              </tbody>
              <tbody  style={{ maxHeight: ((height-70) + "px"), overflow:"hidden"}}>
                <ElecAlertData
                  templateList={this.state.templateList}
                  handleDelete={this.handelDeleteItem}
                  onShowModal={this.handleOpenModal}
                  tempMenuItems={this.dropdownTempMonitor}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

function AddAlertGroupModal(props) {
  let chTempName = "";
  if(props.checkData) {
    if(typeof props.selTemplate.name == "undefined" || props.selTemplate.name == "") {
      chTempName = "error";
    }
  }
  return (
    <Modal
      isOpen={props.showModal}
      style={customStyles}
      onRequestClose={props.onCloseModal}
      shouldCloseOnOverlayClick={true}
      modalTitle={props.selTemplate.monitor_rule_id == "" ? Locales.elecAlert.新增警示群組 : Locales.elecAlert.修改警示群組}
      contentLabel="Minimal Modal Example"
      confirmCB={props.onAddItemClick}
      cancelCB={props.onCloseModal} >
      <table width="100%" className="CorrectSubpageTable">
      <tbody>
        <tr style={{height:"10px"}}>
         <td width="100%">{Locales.elecAlert.警示群組名稱}<label className="required">*</label></td>
        </tr>
        <tr>
          <td width="100%">
            <input autoFocus type="text" className={"InputStyle "+chTempName}
                   maxLength="30"  onChange={e=>props.onValueChanged(e,'template')} value={props.selTemplate.name}></input>
            {/*<div style={{color:"red"}}>{props.alertContent}</div>*/}
          </td>
        </tr>
        <tr style={{height:"10px"}}>
         <td width="100%">{Locales.elecAlert.低電量條件}</td>
        </tr>
        <tr>
          <td width="100%">
            <DropdownButton
              Title={(typeof props.selTempMonitor!="undefined") ? props.selTempMonitor:""}
              Id={(typeof props.selTempMonitor!="undefined") ? props.selTempMonitor.id:""}
              MenuItems={props.tempMenuItems} onSelectChanged={props.onValueChanged} type="monitor"
            />
          </td>
        </tr>
      </tbody>
      </table>
    </Modal>
  );
}

function ElecAlertData(props) {
  const datalist = props.templateList;
  let viewWidth = window.innerWidth - 400;
  return _.map(datalist, data => {
    var condition = props.tempMenuItems.filter(con => {
      return con.monitor_rule_id.match(data.monitor_rule_id);
    });
    return (
      <tr key={data.rule_template_id} className="rowDataContent">
        <td width={`${viewWidth*50/100}px`}>{data.name}</td>
        <td width={`${viewWidth*30/100}px`}>{(condition.length>0)?condition[0].name:""}</td>
        <td width={`${viewWidth*20/100}px`} className="tableBtnRow">
          <Button onClick={e=>props.onShowModal(e, {template: data, selTempMonitor: (typeof condition[0]!="undefined") ? condition[0].lower_limit : "", isModify: true})}>
            {Locales.common.修改}
          </Button>{" "}
          <Button style={{visibility:"hidden"}} className="btn btn-danger" onClick={e=>props.handleDelete(e,data)}>
            {Locales.common.刪除}
          </Button>
        </td>
      </tr>
    );
  });
}

function DropdownButton(props) {
  let options=[];
  for(let i=0; i<100 ; i+=10) {//for(let i=0; i<props.MenuItems.length;i++){
    options.push({value:i,label:i.toString()+"%"});
  }
  const stringify = option => option.label;
  const filterOption = createFilter({ ignoreCase: false, stringify });
  return (
    <Select options={options} filterOption={filterOption} placeholder={Locales.common.請選擇}
            value={options.filter(option => option.value == props.Title)} onChange={e => props.onSelectChanged(e,props.type)}/>
  );
}

function getMaxCode(items) {
  let maxCode = 0;
  return items.reduce((maxCode, val) => {
    maxCode = ( maxCode === undefined || parseInt(val.code,10) > maxCode ) ? val.code : maxCode;
    return maxCode;
  }, 0);
}

function mapStateToProps({ store,token,user }, ownProps) {
  return { store,token,user };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(ElecAlertSubpage);
