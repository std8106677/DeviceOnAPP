import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { apiDefineList, apiDefineAdd, apiDefineDelete, apiDefineUpdate,
         toCancelApi } from "../utils/api";
import { Button, Dropdowns, SplitButton, MenuItem } from "react-bootstrap";
import Select from 'react-select';
import ReactModal from 'react-modal';
import {sortByKey} from "../utils/common";
import ConfirmDialog from "../components/confirm_dialog";
import { Locales } from "../lang/language";


class AbnormalLogSubpage extends Component {
  constructor(props) {
    super(props);
    this.token = this.props.token;
    this.doGetDefineListByType("abnormal_result_condition");
    this.doGetDefineListByType("adnormal_action");
    this.doGetDefineListByType("abnormal_reason");
    this.doGetDefineListByType("abnormal_result");
    //this.conditionDropdow = ["無","溫度恢復正常"];
    //this.actionDropdow = ["無","通知冰箱暫停使用群組","通知裝置故障群組"];
    this.state = {
      reasonsData:[],
      resultData:[],
      conditionDropdown:[],
      actionDropdown:[],
      showModal: false,
      modalType:"",
      reason:"",
      item:{id:"", code:"", name:""} ,
      selCondition:{},
      action:{},
      isModify:false,
      showConfirmModal: false,
      alertContent:"",
      delItem: {},
      delType:"",
      checkData:false
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handelAddNewItem = this.handelAddNewItem.bind(this);
    this.handleItemChanged = this.handleItemChanged.bind(this);
    this.handelDeleteItem = this.handelDeleteItem.bind(this);
    this.handleItemSelectChanged = this.handleItemSelectChanged.bind(this);
    this.doGetDefineListByType = this.doGetDefineListByType.bind(this);
  }

  componentWillUnmount(){
    toCancelApi();
  }

  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false, alertContent: "" });
    this.setState({alertContent:""});
  }

  handleOpenModal (e,type, data) {
    let { item, selCondition, action, isModify } = data;
    this.setState({ item: item });
    this.setState({ selCondition: selCondition});
    this.setState({ action: action});
    this.setState({ reason: "" });
    this.setState({ isModify: isModify });

    switch (type){
      case "result":
        this.setState({ modalType: "result" });
        break;
      case "reason":
        this.setState({ modalType: "reason" });
        break;
    }
    this.setState({ showModal: true });
    //e.stopPropagation();
  }

  handleCloseModal (e) {
    this.setState({ showModal: false });
    this.setState({ alertContent: "" });
    this.setState({ checkData: false });
    e.stopPropagation();
  }

  handleItemChanged(e, type){
    switch (type) {
      case "item":
        this.setState({ item: {id:this.state.item.id, code:this.state.item.code, name:e.target.value} });
        console.log("item name:",e.target.value);
        if(e.target.value.trim() != "") { this.setState({ alertContent: "" }); }
        break;
      case "selCondition":
        var condition = this.state.conditionDropdown.filter(con => {
          return con.id.match(e.target.value.id);
        });
        this.setState({ selCondition: condition[0] });
        console.log("Add selCondition:",condition[0]);
        break;
      case "action":
        var action = this.state.actionDropdown.filter(act => {
          return act.id.match( e.target.value.id );
        });
        this.setState({ action: action[0] });
        console.log("Add action:",action[0]);
        break;
      case "reason":
        this.setState({ reason: e.target.value });
        if(e.target.value.trim() != ""){this.setState({ alertContent:"" });}
        break;
    }
  }

  handelAddNewItem(e){
    let maxCode = 0, code = 0, define = {};
    //console.log("state.item.:",this.state.item.name);
    if( (this.state.modalType=="reason" && this.state.reason.trim()=="" ) ||
        (this.state.modalType=="result" && this.state.item.name.trim()=="") )
    {
      if(this.state.modalType == "result") { this.setState({alertContent:Locales.abnormalLog.請輸入溫度異常結果}); }
      if(this.state.modalType == "reason") { this.setState({alertContent:Locales.abnormalLog.請輸入溫度異常原因}); }
      this.setState({checkData: true});
    } else {
      switch (this.state.modalType) {
        case "result":
          if(this.state.isModify) {
            let item = this.state.item;
            define = {
              type:"abnormal_result",
              id: item.id,
              code:item.code,
              name:item.name,
              extension:{
                abnormal_result_condition_id: this.state.selCondition.id,
                adnormal_action_id: this.state.action.id
              },
              token:this.token
            };
            this.doModifyItem(define);
          } else {
            maxCode = getMaxCode(this.state.resultData);
            code = parseInt(maxCode,10)+1;
            define = {
              type:"abnormal_result",
              code:code,
              name:this.state.item.name,
              extension:{
                abnormal_result_condition_id: this.state.selCondition.id,
                adnormal_action_id: this.state.action.id
              },
              token:this.token
            };
            apiDefineAdd(define)
            .then(function (response) {
              if(response.data.status == 1) {
                this.doGetDefineListByType("abnormal_result");
              } else {
                console.log("response:",response.data);
              }
              this.setState({ showModal: false });
            }.bind(this))
            .catch(function (error) {
              console.log(error);
            });
          }
          break;
        case "reason":
          console.log("Add reason:",this.state.reason);
          maxCode = getMaxCode(this.state.reasonsData);
          //console.log("max code:",maxCode);
          code = parseInt(maxCode,10) + 1;
          define = {type:"abnormal_reason", code:code, name:this.state.reason, token:this.token};
          apiDefineAdd(define)
          .then(function (response) {
            if(response.data.status == 1) {
              this.doGetDefineListByType("abnormal_reason");
            } else {
              console.log("response:",response.data);
            }
            this.setState({ showModal: false });
          }.bind(this))
          .catch(function (error) {
            console.log(error);
          });
          break;
      }
      this.setState({ showModal: false });
      this.setState({ alertContent: "" });
      this.setState({ checkData: false });
    }
  }

  handleItemSelectChanged(e,type) {
    switch (type) {
      case "selCondition":
        var condition = this.state.conditionDropdown.filter(con => {
          return con.id.match(e.value);
        });
        this.setState({ selCondition: condition[0] });
        console.log("Add selCondition:",e);
        break;
      case "action":
        var action = this.state.actionDropdown.filter(act => {
          return act.id.match( e.value);
        });
        console.log("Add action:",e);
        this.setState({ action: action[0] });
        break;
      case "reason":
        this.setState({ reason: e.target.value });
        console.log("Add reason:",e.target.value);
        break;
    }
  }

  handelConfirmDeleted = () => {
    let id = this.state.delItem.id;
    console.log("Delete result id:",id," type:",this.state.delType);
    this.doDelteteItem([id], this.state.delType);
    this.setState({ showConfirmModal: false });
    this.setState({alertContent: ""});
  }

  handelDeleteItem(e, item, type){
    //if (window.confirm('Are you sure you wish to delete this item?')) {
    this.setState({delItem: item});
    switch (type){
      case "result":
        this.setState({alertContent: Locales.abnormalLog.確定刪除溫度異常結果嗎.format("["+item.name+"]")});
        this.setState({delType: 'abnormal_result'});
        //console.log("Delete result id:",item.id);
        break;
      case "reason":
        this.setState({alertContent: Locales.abnormalLog.確定刪除溫度異常原因嗎.format("["+item.name+"]")});
        this.setState({delType: 'abnormal_reason'});
        break;
    }
    this.setState({ showConfirmModal: true });
  }

  doDelteteItem(arrIds, type) {
    apiDefineDelete({ids:arrIds, token:this.token})
    .then(function(response) {
      if(response.data.status == 1) {
        this.doGetDefineListByType(type);
      } else {
        console.log("car clean result delete error:",response.data);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  doModifyItem(data){
    /*let res = await apiDefineUpdate(type,data);
    return res.data.staus;*/
    apiDefineUpdate(data).then(function(response){
      if(response.data.status == 1) {
        this.doGetDefineListByType(data.type);
      } else {
        console.log("upadte abnormal result update error:",response.data);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  doGetDefineListByType(type){
    //console.log("get Type:",type);
    let data = {type: type, token: this.token};
    apiDefineList(data)
    .then(function(response) {
      if(response.data.status == 1) {
        let dataDefine = response.data.defines;
        switch (type) {
          case 'abnormal_reason':
            sortByKey(dataDefine,'code',false,true);
            this.setState({ reasonsData: dataDefine });
            break;
          case 'abnormal_result_condition':
            sortByKey(dataDefine,'code',false,true);
            this.setState({conditionDropdown:doDropdownTranlate(dataDefine)});
            //this.setState({conditionDropdown: dataDefine });
            this.setState({selCondition:dataDefine[0]});
            if(dataDefine.length == 3 && this.state.actionDropdown.length == 4) {
              this.doGetDefineListByType('abnormal_result');
            }
            break;
          case 'adnormal_action':
            sortByKey(dataDefine,'code',false,true);
            this.setState({actionDropdown:doDropdownTranlate(dataDefine)});
            //this.setState({actionDropdown: dataDefine });
            this.setState({action:dataDefine[0]});
            if(this.state.conditionDropdown.length == 3 && dataDefine.length == 4) {
              this.doGetDefineListByType('abnormal_result');
            }
            break;
          case 'abnormal_result':
            //console.log("dataDefine:",dataDefine);
            sortByKey(dataDefine, 'code', false, true);
            this.setState({ resultData: dataDefine });
          break;
          default:
            break;
        }
      } else if(response.data.status == 0 && response.data.error_message=="Can not find define_type:'"+type+"'") {
        switch (type) {
          case 'abnormal_reason':
            this.doAddItemByType({type:type, code:"ZZZZZ", name:Locales.common.其他, extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"1", name:Locales.abnormalLog.清洗, extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"2", name:Locales.abnormalLog.除霜, extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"3", name:Locales.abnormalLog.冰箱溫控室異常, extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"4", name:Locales.abnormalLog.門開過久, extension:{}, token:this.token}) ;
            break;
          case 'abnormal_result_condition':
            this.doAddItemByType({type:type, code:"0", name:"無", extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"1", name:"溫度恢復正常", extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"2", name:"冰箱有除霜設定", extension:{}, token:this.token}) ;
            break;
          case 'adnormal_action':
            this.doAddItemByType({type:type, code:"0", name:"無", extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"1", name:"通知冰箱暫停使用群組", extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"2", name:"通知裝置故障群組", extension:{}, token:this.token}) ;
            this.doAddItemByType({type:type, code:"3", name:"設定除霜起始時間", extension:{}, token:this.token}) ;
            break;
          case 'abnormal_result':
            this.doAddDefaultAbnormalResult(Locales.common.其他, "ZZZZZ", "0", "0");
            this.doAddDefaultAbnormalResult(Locales.abnormalLog.冰箱溫控室恢復正常, "1", "1", "0");
            this.doAddDefaultAbnormalResult(Locales.abnormalLog.調整除霜時間, "2", "2", "3");
            this.doAddDefaultAbnormalResult(Locales.abnormalLog.冰箱溫控室暫停使用, "3", "0", "1");
            this.doAddDefaultAbnormalResult(Locales.abnormalLog.測溫裝置故障, "4", "0", "2");
          break;
          default:
            break;
        }
      } else {
        console.log("Get abnormalLog response error:", response.data);
      }
      //this.props.setStoreType(response.data.defines);
    }.bind(this))
    .catch(function (error) {
      console.log("Get abnormalLog error:",error);
    });
  }

  doAddDefaultAbnormalResult(name,code,condisionCode, actionCode){
    //console.log("this.state.conditionDropdown",this.state.conditionDropdown);
    var condition = this.state.conditionDropdown.filter(con => {
      return con.code.match(condisionCode);
    });
    var action = this.state.actionDropdown.filter(act => {
      return act.code.match(actionCode);
    });
    //console.log("condition",condition);
    //console.log("action",action);
    let define = {
      type: "abnormal_result",
      code: code,
      name: name,
      extension:{
        abnormal_result_condition_id: condition[0].id,
        adnormal_action_id: action[0].id
      },
      token: this.token
    };
    this.doAddItemByType(define);
  }

  doAddItemByType(Item){
    apiDefineAdd(Item)
    .then(function (response) {
      if(response.data.status == 1){
        //console.log(Item.type," add success:",response.data);
        this.doGetDefineListByType(Item.type);
      } else {
        console.log(type," add error:",response.data);
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
    var height = window.innerHeight - 200;
    let  viewWidth = window.innerWidth - 425;
    return(
      <div className="Subpage">
        { this.renderConfirmDialog() }
        <div className="WhiteBGSubpage" style={{height:height+100+"px"}}>
          <div style={{height:"40px", marginLeft:"1%"}}>
            <span className="SettingTilte">{Locales.abnormalLog.溫度異常原因}</span>
            <Button style={{float:"right",marginRight:"30px",cursor:"pointer"}}
                    onClick={e=>this.handleOpenModal(e, "reason", {item:"", selCondition:"", action:"", isModify:false})}>
              {Locales.common.新增選項}
            </Button>
          </div>
          <div style={{width:"98%",height:"30%", overflow: "auto", margin:"1% 1% 2% 1%"}}>
            <table className='settingTable'>
              <tbody>
                <AbnormalReasons
                  handleDelete={this.handelDeleteItem}
                  reasonsData={this.state.reasonsData}
                />
              </tbody>
            </table>
          </div>
          <div style={{height:"40px", marginLeft:"1%"}}>
            <span className="SettingTilte">{Locales.abnormalLog.溫度異常結果}</span>
            <Button style={{float:"right",marginRight:"30px",cursor:"pointer"}}
                    onClick={e=>this.handleOpenModal(e, "result", {item:{id:"",code:"",name:""}, selCondition:this.state.conditionDropdown[0], action:this.state.actionDropdown[0], isModify:false})}>
              {Locales.common.新增選項}
            </Button>
          </div>
          <div className="CompTable" style={{width:"98%",overflow: "auto", overflowX: "hidden",margin:"1% 1% 0 1%"}}>
            <table className='settingTable'>
              <thead className="tableHeader">
                <tr>
                  <th style={{width:"20%"}}>{Locales.abnormalLog.選項}</th>
                  <th style={{width:"28%"}}>{Locales.abnormalLog.選取條件}</th>
                  <th style={{width:"27%"}}>{Locales.abnormalLog.後續連動}</th>
                  <th style={{width:"25%"}}>{Locales.abnormalLog.選項}</th>
                </tr>
              </thead>
              </table>
              </div>
              <div className="CompTable"  style={{width:"98%",height:`${height*45/100}px`, overflowY: "auto",overflowX:"hidden",margin:"0 1% 0 1%" }}>
               <table className='settingTable' style={{marginTop:"0px"}}>
                <tbody style={{maxHeight:"100%", overflow:"hidden"}}>
                  <ResultList
                    handleDelete={this.handelDeleteItem}
                    onShowModal={this.handleOpenModal}
                    actionMenuItems={this.state.actionDropdown}
                    conditionMenuItems={this.state.conditionDropdown}
                    resultData={this.state.resultData}
                  />
                </tbody>
            </table>
          </div>
          <div style={{display:this.state.showModal ? 'show':'none'}}>
            <ModalModifyItem
              type={this.state.modalType}
              onShowModal={this.handleOpenModal}
              onCloseModal={this.handleCloseModal}
              showModal={this.state.showModal}
              onAddItemClick={this.handelAddNewItem}
              onValueChanged={this.handleItemChanged}
              onSelectChanged={this.handleItemSelectChanged}
              item={this.state.item}
              selCondition={this.state.selCondition}
              conditionMenuItems={this.state.conditionDropdown}
              action={this.state.action}
              actionMenuItems={this.state.actionDropdown}
              alertContent={this.state.alertContent}
              checkData={this.state.checkData}
              isModify={this.state.isModify}
            />
          </div>
        </div>
      </div>
    );
  }
}

function ResultList(props){
  let resultData = props.resultData;/*[
    {id:1,item:"冰箱/溫控室恢復正常",selCondition:"YUBjOpv5",action:"BfbjfrB3"},
    {id:2,item:"冰箱/溫控室暫停使用",selCondition:"bcUNcqG2",action:"QpGOjx6D"},
    {id:3,item:"測溫裝置故障",selCondition:"bcUNcqG2",action:"9IVk4bsg"},
    {id:4,item:"調整除霜時間",selCondition:"bcUNcqG2",action:"BfbjfrB3"},
    {id:5,item:"其它",selCondition:"bcUNcqG2",action:"BfbjfrB3"}
  ];*/
  let  viewWidth = window.innerWidth - 310; //減去main menu
  //console.log("1.viewWidth(減main menu):",viewWidth);
  //viewWidth = viewWidth - (window.innerHeight*3/100)  - (window.innerHeight*3/100);
  //console.log("1.viewWidth(減3vh):",viewWidth);
  viewWidth = (viewWidth*0.98)-(viewWidth*0.02) - ( (window.innerWidth/window.innerHeight)*0.3);
  //console.log("1.viewWidth(減 0.98 - 0.02):",viewWidth);
  let viewHeight = (window.innerHeight-200)*0.45;
  let lastWidth = 0;
  if (resultData.length * 60 > viewHeight){
    lastWidth = 35;
  }
  //onsole.log("lastWidth",lastWidth);
  return _.map(resultData, data => {
    var condition = props.conditionMenuItems.filter(con => {
      return con.id.match(data.extension.abnormal_result_condition_id);
    });
    //console.log("condition:",condition[0]);
    var action = props.actionMenuItems.filter(act => {
      return act.id.match( data.extension.adnormal_action_id );
    });
    //console.log("condition:",condition[0].name,"action:",action[0].name);
    return (
      <tr key={data.id} style = {{maxHeight:"100px"}}>
        <td style={{width:`${viewWidth*20/100}px`,height:"60px",verticalAlign:"middle"}}>{data.name}</td>
        <td style={{width:`${viewWidth*28/100}px`,height:"60px",verticalAlign:"middle"}}>{(condition.length>0)?condition[0].name:""}</td>
        <td style={{width:`${viewWidth*27/100}px`,height:"60px",verticalAlign:"middle"}}>{(action.length>0)?action[0].name:""}</td>
        <td style={{width:`${viewWidth*25/100-lastWidth}px`,height:"60px",verticalAlign:"middle"}}>
          <Button disabled={data.code=="ZZZZZ"} style={{marginRight: "10px"}} onClick={e=>props.onShowModal(e,"result",{item:data,selCondition:condition[0],action:action[0],isModify:true})}>{Locales.common.編輯}</Button>
          <Button className="btn btn-danger" disabled={data.code=="ZZZZZ"} onClick={e=>props.handleDelete(e,data,"result")}>{Locales.common.刪除}</Button>
        </td>
      </tr>
    );
  });
}

function AbnormalReasons(props){
  /*let reasonsData = [
    {id:1,reason:"清洗"},
    {id:2,reason:"解凍"},
    {id:3,reason:"冰箱異常"},
    {id:4,reason:"門開過久"},
    {id:5,reason:"其它"},
  ];*/
  return _.map(props.reasonsData, data => {
      //console.log("name:",data.name," ,id:",data.id);
      return (
        <tr key={data.id} className="rowDataContent">
          <td style={{textAlign:"left",width:"90%",paddingLeft: "10px"}}>{data.name}</td>
          <td style={{width:"10%"}}>
            <Button className="btn btn-danger" disabled={data.code=="ZZZZZ"} onClick={e=>props.handleDelete(e,data,"reason")}>{Locales.common.刪除}</Button>
          </td>
        </tr>
      );
    });
}

function ModalModifyItem(props) {
  let chReason = "", chResult = "";
  if(props.checkData) {
    if(props.type == "result") {
      chResult = "error";
    }
    if(props.type == "reason") {
      chReason = "error";
    }
  }
  const modalStyles = {
    overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
    content : {
      top                   : '50%',
      left                  : '50%',
      right                 : 'auto',
      bottom                : 'auto',
      marginRight           : '-50%',
      transform             : 'translate(-50%, -50%)',
      backgroundColor:'#FFF',
      border:'none',
      height: '540px'
    }
  };
//  console.log("1.props.action:",props.action);
 //let temp = (typeof props.action!="undefined")? props.action.name:"";
 //console.log(" props.action:",temp);
  if(props.type == "result") {
    return (
      <ReactModal isOpen={props.showModal}
                  contentLabel="Add Watched Item"
                  style={modalStyles}
                  onRequestClose={props.onCloseModal}
                  shouldCloseOnOverlayClick={true} >
        <div style={{minHeight:"400px", paddingTop:"5%",paddingBottom:"10%"}}>
          <div style={{fontSize: "20px", fontWeight: "bold", marginBottom:"15px"}}>
            {props.isModify ? Locales.abnormalLog.編輯溫度異常結果 : Locales.abnormalLog.新增溫度異常結果}
          </div>
          <table width="100%" className="CorrectSubpageTable">
           <tbody>
            <tr style={{height:"10px"}}>
             <td width="100%">{Locales.abnormalLog.選項}<label className="required">*</label></td>
            </tr>
            <tr>
              <td width="100%">
                <input autoFocus type="text" className={"InputStyle "+chResult} maxLength="30"
                       placeholder={Locales.abnormalLog.請輸入選項} onChange={e=>props.onValueChanged(e,'item')} value={props.item.name}></input>
                {/*<div style={{color:"red"}}>{props.alertContent}</div>*/}
              </td>
            </tr>
            <tr style={{height:"10px"}}>
             <td width="100%">{Locales.abnormalLog.選取條件}</td>
            </tr>
            <tr>
              <td width="100%">
                <DropdownButton Title={(typeof props.selCondition != "undefined") ? props.selCondition.name:""}
                                Id="1" MenuItems={props.conditionMenuItems} onSelectChanged={props.onSelectChanged} type="selCondition"/>
              </td>
            </tr>
            <tr style={{height:"10px"}}>
              <td width="100%">{Locales.abnormalLog.後續連動}</td>
            </tr>
            <tr>
              <td width="100%">
                <DropdownButton Title={(typeof props.action != "undefined") ? props.action.name : ""}
                                Id="2" MenuItems={props.actionMenuItems} onSelectChanged={props.onSelectChanged} type="action"/>
              </td>
            </tr>
           </tbody>
          </table>
          <div style={{float: "right", marginTop: "130px", bottom: 10}}>
            <Button onClick={props.onCloseModal}
                    style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>
              {Locales.common.取消}
            </Button>
            <Button onClick={e=>props.onAddItemClick(e,props.type)}
                    style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>
              {Locales.common.確認}
            </Button>
          </div>
        </div>
      </ReactModal>
    );
  } else {//新增溫度異常原因
    return(
      <ReactModal isOpen={props.showModal}
                  contentLabel="Add Watched Item"
                  style={modalStyles}
                  onRequestClose={props.onCloseModal}
                  shouldCloseOnOverlayClick={true} >
        <div style={{fontSize: "20px", fontWeight: "bold", marginBottom:"15px"}}>{Locales.abnormalLog.新增溫度異常原因}</div><br />
        <table width="100%" className="CorrectSubpageTable">
         <tbody>
         <tr style={{height:"10px"}}>
           <td width="100%">{Locales.abnormalLog.異常原因}<label className="required">*</label></td>
          </tr>
          <tr>
            <td width="100%">
              <input autoFocus type="text" className={"InputStyle "+chReason}
                     placeholder={Locales.abnormalLog.請輸入原因}
                     maxLength="30" onChange={e=>props.onValueChanged(e,"reason")}></input>
              {/*<div style={{color:"red"}}>{props.alertContent}</div>*/}
            </td>
          </tr>
         </tbody>
        </table>
        <div style={{float: "right", marginTop: "290px", bottom: 10}}>
          <Button onClick={props.onCloseModal}
                  style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>
            {Locales.common.取消}
          </Button>
          <Button onClick={e=>props.onAddItemClick(e,props.type)}
                  style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>
            {Locales.common.確認}
          </Button>
        </div>
      </ReactModal>
    );
  }
}

function DropdownButton(props) {
  let options = [];
  for(let i=0 ; i<props.MenuItems.length ; i++) {
    options.push({value: props.MenuItems[i].id, label: props.MenuItems[i].name});
  }
  return (
  <Select options={options} maxMenuHeight={120} placeholder={Locales.common.請選擇}
          value={options.filter(option => option.label === props.Title)} onChange={e => props.onSelectChanged(e,props.type)}/>
    /*{<SplitButton
      bsStyle="default"
      title={props.Title}
      key={props.Id}
      id={`split-button-basic-${props.Id}`}
      toggleLabel={props.Title}
    >
      <MenuItem eventKey="0" onSelect={e => props.onSelectChanged(e,props.type)}>{props.MenuItems[0]}</MenuItem>
      <MenuItem eventKey="1" onSelect={e => props.onSelectChanged(e,props.type)}>{props.MenuItems[1]}</MenuItem>
      <MenuItem eventKey="2" onSelect={e => props.onSelectChanged(e,props.type)}>{props.MenuItems[2]}</MenuItem>
    </SplitButton>}*/
  );
}

function getMaxCode(items) {
  let maxCode = 0;
  return items.reduce((maxCode, val) => {
    maxCode = ( maxCode === undefined || parseInt(val.code,10) > maxCode ) ? val.code : maxCode;
    return maxCode;
  }, 0);
}

function doDropdownTranlate(list) {
  for(let i=0 ; i<list.length ; i++) {
    switch (list[i].name) {
      case "無":
        list[i].name = Locales.abnormalLog.無;
        break;
      case "溫度恢復正常":
        list[i].name = Locales.abnormalLog.溫度恢復正常;
        break;
      case "冰箱有除霜設定":
        list[i].name = Locales.abnormalLog.冰箱有除霜設定;
        break;
      case "通知冰箱暫停使用群組":
        list[i].name = Locales.abnormalLog.通知冰箱暫停使用群組;
        break;
      case "設定除霜起始時間":
        list[i].name = Locales.abnormalLog.設定除霜起始時間;
        break;
      case "通知裝置故障群組":
        list[i].name = Locales.abnormalLog.通知裝置故障群組;
        break;
      default:
        break;
    }
  }
  return list;
}

function mapStateToProps({ store, token }, ownProps) {
  return { store, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(AbnormalLogSubpage);
