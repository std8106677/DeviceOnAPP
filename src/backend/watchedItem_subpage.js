import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { apiDefineList, apiDefineAdd, apiDefineDelete, toCancelApi } from "../utils/api";
import { Tab, Tabs, Button, Form, FormGroup, FormControl, ControlLabel, Col } from "react-bootstrap";
import ReactModal from 'react-modal';
import {sortByKey} from "../utils/common";
import ConfirmDialog from "../components/confirm_dialog";
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import { Locales } from "../lang/language";

class WatchedItemSubpage extends Component {
  constructor(props) {
    super(props);
    this.token = this.props.token;
    this.doGetWatchedItemList(); //先取得項目
    this.state = {
      watchedData:[],
      showModal: false,
      watchItem:"",
      showConfirmModal: false,
      alertContent:"",
      delItem: {},
      checkData:false
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handelAddNewItem = this.handelAddNewItem.bind(this);
    this.handleItemChanged = this.handleItemChanged.bind(this);
    this.handelDeleteItem = this.handelDeleteItem.bind(this);
    this.doGetWatchedItemList = this.doGetWatchedItemList.bind(this);
  }

  componentWillUnmount() {
    toCancelApi();
  }

  handleOpenModal (e) {
    this.setState({ showModal: true });
    e.stopPropagation();
  }

  handleCloseModal (e) {
    this.setState({ showModal: false });
    this.setState({ alertContent: "" });
    this.setState({ watchItem: "" });
    this.setState({ checkData: false });
    e.stopPropagation();
  }

  handleItemChanged(e) {
    if(e.target.value.trim()!='') {
      this.setState({alertContent:""});
    }
    this.setState({ watchItem: e.target.value });
  }

  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false });
    this.setState({ alertContent: "" });
  }

  handelAddNewItem(e){
    //const {token} = this.props;
    if(this.state.watchItem.trim()=="") {
      this.setState({alertContent: Locales.watch.請輸入巡檢品項});
      this.setState({checkData: true});
      //this.setState({ showConfirmModal: true });
    } else {
      this.setState({alertContent: ""});
      let maxCode = getMaxCode(this.state.watchedData);
      //console.log("max code:",maxCode);
      let code = parseInt(maxCode,10)+1;
      let define = {type: "inspection_item", code: code, name: this.state.watchItem, token: this.token};
      apiDefineAdd(define)
      .then(function(response) {
        if(response.data.status == 1) {
          this.doGetWatchedItemList();
        } else {
          console.log("response:",response.data);
        }
        //this.props.setStoreType(response.data.defines);
      }.bind(this))
      .catch(function(error) {
        console.log(error);
      });
      this.setState({ showModal: false });
      this.setState({ watchItem: "" });
      this.setState({ checkData: false });
    }
  }

  handelDeleteItem(e,item){
    //const {token} = this.props;
    this.setState({ alertContent: Locales.watch.確定刪除品項嗎.format(item.name) });
    this.setState({ delItem: item });
    this.setState({ showConfirmModal: true });
  }

  handelConfirmDeleted = () => {
    let data = {ids: [this.state.delItem.id], token: this.token};
    apiDefineDelete(data)
    .then(function(response) {
      if(response.data.status == 1) {
        this.doGetWatchedItemList();
      } else {
        console.log("response:",response.data);
      }
      this.setState({ showConfirmModal: false });
      this.setState({ alertContent: "" });
      //this.props.setStoreType(response.data.defines);
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  doGetWatchedItemList() {
    //const {token} = this.props;
    let data = {type: "inspection_item", token: this.token};
    apiDefineList(data)
    .then(function(response) {
      if(response.data.status==1){
        let watchItemList = response.data.defines;
        sortByKey(watchItemList,'code',false,true);
        this.setState({ watchedData: watchItemList });
      } else if(response.data.status==0 && response.data.error_message=="Can not find define_type:'inspection_item'") {//新增預設項目
        let define = {type: "inspection_item", code: "ZZZZZ", name: Locales.common.其他, token: this.token};
        apiDefineAdd(define)
        .then(function (response) {
          if(response.data.status == 1) {
            this.doGetWatchedItemList();
          } else {
            console.log("response:",response.data);
          }
          //this.props.setStoreType(response.data.defines);
        }.bind(this))
        .catch(function(error) {
          console.log(error);
        });
      } else {
        console.log("doGetWatchedItemList error response:",response.data);
      }
      //this.props.setStoreType(response.data.defines);
    }.bind(this))
    .catch(function(error) {
      console.log("doGetWatchedItemList error:",error);
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
    var height = (window.innerHeight - 250) + "px";
    return(
      <div className="Subpage">
        { this.renderConfirmDialog() }
        <div className="WhiteBGSubpage">
          <div style={{height:"40px", marginLeft:"1%"}}>
            <span className="SettingTilte">{Locales.watch.巡檢品項}</span>
            <Button style={{float:"right",marginRight:"25px",cursor:"pointer"}} onClick={this.handleOpenModal}>{Locales.common.新增選項}</Button>
          </div>
          <div style={{width:"98%",height:height, overflow: "auto",overflowX:"hidden", margin:"1% 1% 2% 1%"}}>
            <table className='settingTable'>
              <tbody>
                <WatchedList
                  watchedData={this.state.watchedData}
                  handleDelete={this.handelDeleteItem}
                />
              </tbody>
            </table>
          </div>
        </div>
        <div style={{display:this.state.showModal ? 'show':'none'}}>
          <ModalAddWatchItem
            onShowModal={this.handleOpenModal}
            onCloseModal={this.handleCloseModal}
            showModal={this.state.showModal}
            onAddItemClick={this.handelAddNewItem}
            onValueChanged={this.handleItemChanged}
            alertContent={this.state.alertContent}
            checkData={this.state.checkData}
          />
        </div>
      </div>
    );
  }
}

function ModalAddWatchItem(props) {
  let chWatchItem = "";
  if(props.checkData) {
      chWatchItem = "error";
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
  return (
    <ReactModal
      isOpen={props.showModal}
      contentLabel="Add Watched Item"
      style={modalStyles}
      onRequestClose={props.onCloseModal}
      shouldCloseOnOverlayClick={true} >
      <div style={{fontSize: "20px", fontWeight: "bold"}}>{Locales.watch.新增巡檢品項}</div>
        <div style={{marginTop: "15px",marginBottom: "15px"}}>
          <label>{Locales.watch.品項}<label className="required">*</label></label>
          <input autoComplete="off" autoFocus type="text" className={chWatchItem+" InputStyle"} id="validationServer01"
                 placeholder={Locales.watch.巡檢品項} maxLength="30" onChange={e=>props.onValueChanged(e)} required></input>
          {/*<div style={{color:"red"}}>{props.alertContent}</div>*/}
         </div>
      <div style={{float: "right", marginTop: "30px"}}>
        <Button onClick={props.onCloseModal} style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>
          {Locales.common.取消}
        </Button>
        <Button onClick={props.onAddItemClick} style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>
          {Locales.common.確認}
        </Button>
      </div>
    </ReactModal>
  );
}

function WatchedList(props){
  return _.map(props.watchedData, data => {
    return (
      <tr key={data.id} className="rowDataContent">
        <td style={{textAlign:"left",width:"90%",paddingLeft: "10px"}}>{data.name}</td>
        <td style={{width:"10%"}}>
          <Button className="btn btn-danger" disabled={data.code=="ZZZZZ"} onClick={e=>props.handleDelete(e,data)}>{Locales.common.刪除}</Button>
        </td>
      </tr>
    );
  });
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
export default connect(mapStateToProps, {  })(WatchedItemSubpage);
