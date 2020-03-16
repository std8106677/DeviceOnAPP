import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { Button } from "react-bootstrap";
import ReactModal from 'react-modal';
import ReactFileReader from 'react-file-reader';
import NumericInput from 'react-numeric-input';
import { apiDefineList, apiDefineAdd, apiDefineDelete, apiDefineUpdate, toCancelApi } from "../utils/api";
import { sortByKey } from "../utils/common";
import ConfirmDialog from "../components/confirm_dialog";
import { Locales } from "../lang/language";

class TransportSubpage extends Component {
  constructor(props) {
    super(props);
    this.token = this.props.token;
    this.doGetDefinByType("car_clean");
    this.doGetDefinByType("trans_standard");
    this.state = {
      showModal: false,
      modalType: "",
      carCleanList: [],
      cleanResult: "",
      isHighLight: false,
      standardList: [],
      standardItem: {},
      dataLimit: "",
      invalidLimit: 0,
      isModify: false,
      showConfirmModal: false,
      alertContent: "",
      delItem: {},
      delType: "",
      checkData: false
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handelAddNewItem = this.handelAddNewItem.bind(this);
    this.handleItemChanged = this.handleItemChanged.bind(this);
    this.handelDeleteItem = this.handelDeleteItem.bind(this);
    this.handleCheckChanged = this.handleCheckChanged.bind(this);
    this.handleDataModify = this.handleDataModify.bind(this);
    this.doGetDefinByType = this.doGetDefinByType.bind(this);
    this.doModifyItem = this.doModifyItem.bind(this);
  }

  componentWillUnmount() {
    toCancelApi();
  }

  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false });
    this.setState({ alertContent: "" });
  }

  handleOpenModal(e,type, data) {
    let {cleanResult, standardItem, dataLimit, invalidLimit, isModify} = data;
    this.setState({ cleanResult: "" });
    this.setState({ standardItem: standardItem });
    this.setState({ dataLimit: dataLimit });
    this.setState({ invalidLimit: invalidLimit });
    this.setState({ isModify: isModify});
    switch(type) {
      case "result":
        this.setState({ modalType: "result" });
        break;
      case "standard":
        this.setState({ modalType: "standard" });
        break;
    }
    this.setState({ showModal: true });
    e.stopPropagation();
  }

  handleCloseModal(e) {
    this.setState({ showModal: false });
    this.setState({ alertContent: "" });
    this.setState({ checkData: false });
    e.stopPropagation();
  }

  handleItemChanged(e,type) {
    switch(type) {
      case "cleanResult":
        this.setState({ cleanResult: e.target.value });
        if(e.target.value.trim() != "") { this.setState({alertContent:""}); }
        break;
      case "standardName":
        this.setState({ standardItem: {id: this.state.standardItem.id, code: this.state.standardItem.code, name: e.target.value} });
        if(e.target.value.trim() != ""){this.setState({alertContent:""});}
        break;
      case "dataLimit":
        if(e > 2000) { e=2000; }
        this.setState({ dataLimit: e == null ? 0 : Math.floor(e) });
        //console.log("Add dataLimit:",e);
        break;
      case "invalidLimit":
        if(e > 2000) { e = 2000; }
        this.setState({ invalidLimit: e == null ? 0 : Math.floor(e) });
        //console.log("Add invalidLimit:",e);
        break;
    }
  }

  async handelAddNewItem(e) {
    //console.log("standardItem:",this.state.standardItem,", modalType",this.state.modalType);
    if( (this.state.standardItem.name.trim()=="" && this.state.modalType=="standard") ||
        (this.state.cleanResult.trim()=="" && this.state.modalType=="result")) {
      if(this.state.modalType == "result") { this.setState({alertContent: Locales.transport.請輸入清潔情況}); }
      if(this.state.modalType == "standard") { this.setState({alertContent:Locales.transport.請輸入標準名稱}); }
      this.setState({checkData: true});
    } else {
      switch(this.state.modalType) {
        case "result":
          let maxCode = getMaxCode(this.state.carCleanList);
          //console.log("max code:",maxCode);
          let code = parseInt(maxCode,10) + 1;
          this.doAddItemByType({type: "car_clean", code : code, name : this.state.cleanResult, extension: {isHighLight: this.state.isHighLight}, token: this.token});
          //console.log("Add result:",this.state.cleanResult,", ",this.state.isHighLight);
          break;
        case "standard":
          if(this.state.invalidLimit > this.state.dataLimit){
            this.setState({ alertContent: Locales.transport.不合格筆數不可大於資料上限筆數 });
            this.setState({ showConfirmModal: true });
            return;
          }
          if(this.state.isModify) {
              /*let itemRes = await apiDefineList(this.state.standardItem.id);
              let data = itemRes.data.defines,dataLimitId, invalidLimitId;
              for(let i=0;i<data.length;i++){
                if(data[i].code == "LOD"){dataLimitId = data[i].id;}
                else if(data[i].code == "LOI"){invalidLimitId = data[i].id;}
              }
              if(this.doModifyItem(this.state.standardItem.id,{id:dataLimitId,code:"LOD",name:this.state.dataLimit}) &&
                this.doModifyItem(this.state.standardItem.id,{id:invalidLimitId,code:"LOI",name:this.state.invalidLimit})
              ){*/
            this.doModifyItem({ type: "trans_standard", id: this.state.standardItem.id, code: this.state.standardItem.code,
                                name: this.state.standardItem.name, extension:{LOD:this.state.dataLimit,LOI:this.state.invalidLimit}, token: this.token });
              //}
          } else {
            let maxCode = getMaxCode(this.state.standardList);
            //console.log("max code:",maxCode);
            let code = parseInt(maxCode,10)+1;
            let res = await apiDefineAdd({type: "trans_standard", code: code, name: this.state.standardItem.name,
                                          extension:{LOD: this.state.dataLimit, LOI: this.state.invalidLimit}, token: this.token}) ;
            /*let standardId = res.data.define_id;
            console.log("res:",res,"standardId:",standardId);
            res = await apiDefineAdd(standardId,{code:"LOD",name:this.state.dataLimit}) ;
            res = await apiDefineAdd(standardId,{code:"LOI",name:this.state.invalidLimit}) ;
            console.log("Add standard:",this.state.standardItem,", ",this.state.dataLimit,", ",this.state.invalidLimit);*/
          }
          this.doGetDefinByType('trans_standard');
          break;
        }
      this.setState({ showModal: false });
      this.setState({ alertContent: "" });
      this.setState({ checkData: false });
    }
  }

  doAddItemByType(Item) {
    apiDefineAdd(Item)
    .then(function (response) {
      if(response.data.status == 1) {
        console.log(Item.type," add success:",response.data);
        this.doGetDefinByType(Item.type);
      } else {
        console.log(type," add error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  doModifyItem(data) {
    /*let res = await apiDefineUpdate(type,data);
    return res.data.staus;*/
    apiDefineUpdate(data).then(function(response) {
      if(response.data.status == 1) {
        this.doGetDefinByType(data.type);
      } else {
        console.log("car clean result update error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleCheckChanged(e){
    console.log("isHighLight:",e.target.checked);
    this.setState({ isHighLight: e.target.checked });
  }

  handelConfirmDeleted = () => {
    let id = this.state.delItem.id;
    //console.log("Delete result id:",id," type:",this.state.delType);
    this.doDelteteItem([id], this.state.delType);
    this.setState({ showConfirmModal: false });
    this.setState({ alertContent: "" });
  }

  async handelDeleteItem(e,item,type) {
    this.setState({delItem:item});
    //if (window.confirm('Are you sure you wish to delete this item?')) {
    switch (type) {
      case "result":
        this.setState({alertContent:Locales.transport.確定刪除運輸車情況嗎.format(item.name)});
        this.setState({delType:'car_clean'});
        //this.doDelteteItem([id],'car_clean');
        //console.log("Delete result id:",id);
        break;
      case "standard":
        //先刪 標準內設訂項目，才刪標準
        /*let res = await apiDefineList(id) ;
        let items = res.data.defines;
        let idArray = [];
        for(let i=0;i<items.length;i++){
          idArray.push(items[i].id)
        }
        this.doDelteteItem(idArray,''); //type給空的，先不重整畫面*/
        //再把 standard項目刪除
        this.setState({alertContent:Locales.transport.確定刪除運輸標準嗎.format(item.name)});
        this.setState({delType:'trans_standard'});
        //this.doDelteteItem([id],'trans_standard');
        //console.log("Delete standard id:",id);
        break;
      //}
    }
    this.setState({ showConfirmModal: true });
  }

  doDelteteItem(arrIds,type) {
    apiDefineDelete({ids: arrIds, token: this.token})
    .then(function(response) {
      if(response.data.status == 1) {
        this.doGetDefinByType(type);
      } else {
        console.log("car clean result delete error:",response.data);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  handleDataModify() {
    this.setState({ modalType: "vendor" });
    this.setState({ showModal: true });
  }

  doGetDefinByType(type) {
    let data = {type: type, token: this.token};
    apiDefineList(data)
    .then(function(response) { //加入async 因為必須等 細部資訊都回來才set state
      if(response.data.status==1) {
        let data = response.data.defines;
        switch (type) {
          case 'car_clean':
            sortByKey(data, 'code', false, true);
            this.setState({ carCleanList: data });
            break;
          case 'trans_standard':
            var transStandard = [];
            sortByKey(data, 'code', false, true);
            for(let i=0 ; i<data.length ; i++) {
              //console.log("data:",data[i]);
              /*let itemReponse = await apiDefineList(data[i].id) ;
              console.log("reponse:",itemReponse);
              let standardContain = itemReponse.data.defines;
              console.log("standardContain:",standardContain);
              let dataLimit=0,invalidLimit=0;
              for(let j=0; j<2; j++){
                if(standardContain[j].code=="LOD"){dataLimit=standardContain[j].name;}
                else if(standardContain[j].code=="LOI"){invalidLimit=standardContain[j].name;}
              }*/
              transStandard.push({id: data[i].id, name: data[i].name, code: data[i].code,
                                  dataLimit: data[i].extension.LOD, invalidLimit: data[i].extension.LOI});
            }
            this.setState({ standardList: transStandard });
            //console.log("transStandard:",transStandard);
            break;
          default:
            break;
        }
      } else if(response.data.status == 0 && response.data.error_message=="Can not find define_type:'"+type+"'") {
        if(response.data.error_code == "1009") {
          switch (type) {
            case 'car_clean':
              this.setState({ carCleanList: [] });
              //this.doAddItemByType({type:"car_clean",code:"0",name:"合格",extension:{isHighLight:false},token:this.token});
              //this.doAddItemByType({type:"car_clean",code:"1",name:"不合格",extension:{isHighLight:true},token:this.token});
              break;
            case 'trans_standard':
              this.setState({standardList: [] });
              this.doAddItemByType({type: "trans_standard", code: "0", name: Locales.common.預設, extension: {LOD:2000,LOI:2000}, token: this.token}) ;
              this.doGetDefinByType(type);
              break;
            }
        } else {
          console.log("doGetDefinByType error response:",response);
        }
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetDefinByType error:",error);
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
    let viewWidth = window.innerWidth - 300; //減去main menu
    viewWidth = viewWidth - (viewWidth*6/100);
    return(
      <div className="Subpage">
        { this.renderConfirmDialog() }
        <div className="WhiteBGSubpage" style={{height:height+100+"px"}}>
          <div style={{height:"40px", marginLeft:"1%"}}>
            <span className="SettingTilte">{Locales.transport.運輸車清潔情況}</span>
            <Button style={{float:"right",marginRight:"30px",cursor:"pointer"}}
                    onClick={e=>this.handleOpenModal(e,"result",{cleanResult:"",standardItem:{id:"",code:"",name:""},dataLimit:1,invalidLimit:0,isModify:false})}>
              {Locales.common.新增選項}
            </Button>
          </div>
          <div style={{width:"98%", height:"20%", overflow: "auto", margin:"1% 1% 2% 1%"}}>
            <table className='settingTable' id="tblTrans">
              <tbody>
                <TransportCleanResult
                  handleDelete={this.handelDeleteItem}
                  resultData={this.state.carCleanList}
                />
              </tbody>
            </table>
          </div>
          <div style={{height:"40px", marginLeft:"1%"}}>
            <span className="SettingTilte">{Locales.transport.運輸標準}</span>
            <Button style={{float:"right",marginRight:"30px",cursor:"pointer"}}
                    onClick={e=>this.handleOpenModal(e,"standard",{cleanResult:"",standardItem:{id:"",code:"",name:""},dataLimit:1,invalidLimit:0,isModify:false})}>
              {Locales.transport.新增標準}
            </Button>
          </div>
          <div className="CompTable"  style={{width:`${viewWidth*98/100}px`, margin:"1% 1% 0 1%"}}>
            <table className='settingTable'>
              <thead className="tableHeader">
                <tr>
                  <th style={{width:"25%"}}>{Locales.transport.標準名稱}</th>
                  <th style={{width:"25%"}}>{Locales.transport.資料筆數上限}</th>
                  <th style={{width:"25%"}}>{Locales.transport.不合格筆數上限}</th>
                  <th style={{width:"25%"}}>{Locales.transport.選項}</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="CompTable"  style={{width:`${viewWidth*98/100}px`, height:`${height*55/100}px`, overflow: "auto",overflowX:"hidden",margin:"0 1% 0 1%" }}>
            <table className='settingTable' style={{marginTop:"0px"}}>
              <tbody style={{maxHeight:"100%", overflow:'hidden'}}>
                <TransportStandarList
                  handleDelete={this.handelDeleteItem}
                  onShowModal={this.handleOpenModal}
                  resultData={this.state.standardList}
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
              onCheckChanged={this.handleCheckChanged}
              standardItem={this.state.standardItem}
              dataLimit={this.state.dataLimit}
              invalidLimit={this.state.invalidLimit}
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

function TransportCleanResult(props){
  /*let resultData = [
    {id:1,result:"合格",isHighLight:false},
    {id:2,result:"不合格",isHighLight:true}
  ];*/
  return _.map(props.resultData, data => {
    return (
      <tr key={data.id} className="rowDataContent">
        <td style={{textAlign:"left",width:"90%",paddingLeft: "10px"}}>{data.name}</td>
        <td style={{width:"10%"}}>
          <Button className="btn btn-danger" onClick={e=>props.handleDelete(e,data,"result")}>{Locales.common.刪除}</Button>
        </td>
      </tr>
    );
  });
}

function TransportStandarList(props){
  /*let resultData = [
    {id:1,name:"短程運輸",dataLimit:"12",invalidLimit:1},
    {id:2,name:"中程運輸",dataLimit:"50",invalidLimit:3},
    {id:3,name:"長程運輸",dataLimit:"300",invalidLimit:10}
  ];*/
  let viewWidth = window.innerWidth - 300; //減去main menu
  viewWidth = viewWidth - (viewWidth*6/100);
  let viewHeight = (window.innerHeight-200) * 55/100;
  let lastWidth = 0;
  if (props.resultData.length * 60 > viewHeight) {
    lastWidth = 35;
  }
  return _.map(props.resultData, data => {
    return (
      <tr key={data.id} >
        <td style={{width:`${viewWidth*25/100}px`,height:"60px",verticalAlign:"middle"}}>{data.name}</td>
        <td style={{width:`${viewWidth*25/100}px`,height:"60px",verticalAlign:"middle"}}>{Locales.transport.少於幾筆.format(data.dataLimit)}</td>
        <td style={{width:`${viewWidth*25/100}px`,height:"60px",verticalAlign:"middle"}}>{data.invalidLimit}</td>
        <td style={{width:`${viewWidth*25/100 - lastWidth}px`,height:"60px",verticalAlign:"middle"}}>
          <Button style={{marginRight: "10px"}}
                  onClick={e=>props.onShowModal(e,"standard",{cleanResult:"",standardItem:data,dataLimit:data.dataLimit,invalidLimit:data.invalidLimit,isModify:true})}>
            {Locales.common.編輯}
          </Button>
          <Button className="btn btn-danger" disabled={data.code=="0"} onClick={e=>props.handleDelete(e,data,"standard")}>{Locales.common.刪除}</Button>
        </td>
      </tr>
    );
  });
}

function ModalModifyItem(props) {
  let chStandard = "", chResult = "";
  if(props.checkData) {
    if(props.type == "result") {
      chResult = "error";
    }
    if(props.type == "standard") {
      chStandard = "error";
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
      border:'none'
    }
  };
  if(props.type == "result") {
    return(
      <ReactModal
        isOpen={props.showModal}
        contentLabel="Add Watched Item"
        style={modalStyles}
        onRequestClose={props.onCloseModal}
        shouldCloseOnOverlayClick={true} >
        <div style={{fontSize: "20px", fontWeight: "bold"}}>{Locales.transport.新增運輸車清潔情況}</div>
        <div style={{marginTop: "15px",marginBottom: "15px"}}>
          <label>{Locales.transport.清潔情況}</label><label className="required">*</label>
          <input autoFocus type="text" className={chResult+" InputStyle"}
                 placeholder={Locales.transport.清潔情況} maxLength="30" onChange={e=>props.onValueChanged(e,"cleanResult")} required>
          </input>
          {/*<div style={{color:"red"}}>{props.alertContent}</div>*/}
          <input style={{marginTop: "15px",marginRight: "5px"}} type="checkbox" onChange={props.onCheckChanged} />{Locales.transport.Highlight}
        </div>
        <div style={{float: "right", marginTop: "30px"}}>
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
  } else {//新增運輸車情況
    return(
      <ReactModal
        isOpen={props.showModal}
        contentLabel="Add Watched Item"
        style={modalStyles}
        onRequestClose={props.onCloseModal}
        shouldCloseOnOverlayClick={true} >
        <div style={{fontSize: "20px", fontWeight: "bold"}}>{props.isModify? Locales.transport.編輯運輸標準:Locales.transport.新增運輸標準}</div>
        <div style={{marginTop: "15px",marginBottom: "15px"}}>
          <table width="100%" className="CorrectSubpageTable">
            <tbody>
              <tr style={{height:"10px"}}>
                <td colSpan="2" width="30%">{Locales.transport.標準名稱}<label className="required">*</label></td>
              </tr>
              <tr style={{height:"50px"}}>
                <td colSpan="2" width="70%">
                  <input autoFocus type="text" className={chStandard+" InputStyle"}
                         placeholder={Locales.transport.標準名稱}  maxLength="30" onChange={e=>props.onValueChanged(e,"standardName")} value={props.standardItem.name}></input>
                  {/*<div style={{color:"red"}}>{props.alertContent}</div>*/}
                </td>
              </tr>
              <tr style={{height:"50px"}}>
                <td width="30%">{Locales.transport.資料筆數上限}:</td>
                <td width="70%">
                  <NumericInput min={0} max={2000} value={props.dataLimit} size={4}
                                style={{ wrap: {margin:"0 10px 0 10px"}}} onChange={e=>props.onValueChanged(e,"dataLimit")}/>
                  {Locales.common.筆}
                </td>
              </tr>
              <tr style={{height:"50px"}}>
                <td width="30%">{Locales.transport.不合格筆數上限}:</td>
                <td width="70%">
                  <NumericInput min={0} max={2000} value={props.invalidLimit} size={4}
                                style={{ wrap:{margin:"0 10px 0 10px"}, input:{paddingLeft:"10px"}}} onChange={e=>props.onValueChanged(e,"invalidLimit")}/>
                  {Locales.common.筆}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{float: "right", marginTop: "30px"}}>
          <Button onClick={props.onCloseModal} style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>
            {Locales.common.取消}
          </Button>
          <Button onClick={e=>props.onAddItemClick(e,props.type)} style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>
            {Locales.common.確認}
          </Button>
        </div>
      </ReactModal>
    );
  }
}

function getMaxCode(items) {
  let maxCode = 0;
  return items.reduce((maxCode, val) => {
    maxCode = ( maxCode === undefined || parseInt(val.code,10) > maxCode ) ? val.code : maxCode;
    return maxCode;
  }, 0);
}

function mapStateToProps({ store, token }, ownProps) {
  return { store, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(TransportSubpage);
