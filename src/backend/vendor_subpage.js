import React, { Component } from "react";
import { connect } from "react-redux";
import {  } from "../actions";
import { Button} from "react-bootstrap";
import ReactModal from 'react-modal';
import ReactFileReader from 'react-file-reader';
import { apiDefineList, apiDefineAdd, apiDefineDelete, toCancelApi} from "../utils/api";
import { sortByKey } from "../utils/common";
import filterFactory, {
  selectFilter,
  textFilter
} from "react-bootstrap-table2-filter";
import {CompTable} from "../components/comp_Table";
import { Locales } from "../lang/language";

class VendorSubpage extends Component {
  constructor(props) {
    super(props);
    this.doGetVendorList();
    this.state = {
      showModal: false,
      vendorList:[],
      vendorNo:"",
      vendorName:""
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handelAddNewItem = this.handelAddNewItem.bind(this);
    this.handleItemChanged = this.handleItemChanged.bind(this);
    this.handelDeleteItem = this.handelDeleteItem.bind(this);
    this.handleVendorModify = this.handleVendorModify.bind(this);
    this.doGetVendorList = this.doGetVendorList.bind(this);
    this.doDelteteVendorList = this.doDelteteVendorList.bind(this);
    this.doAddVendorList = this.doAddVendorList.bind(this);
    this.handleFiles = this.handleFiles.bind(this);
  }

  componentWillUnmount() {
    toCancelApi();
  }

  handleOpenModal (e,data) {
    let {vendorNo,vendorName} = data;
    console.log("vendorNo:",vendorNo,", vendorName:",vendorName);
    this.setState({ vendorNo: vendorNo });
    this.setState({ vendorName: vendorName });
    this.setState({ showModal: true });
    e.stopPropagation();
  }

  handleCloseModal (e) {
    this.setState({ showModal: false });
    e.stopPropagation();
  }

  handleItemChanged(e,type){
    switch (type){
      case "vendorNo":
          this.setState({ vendorNo: e.target.value });
          console.log("Add vendorNo:",e.target.value);
          break;
      case "vendorName":
          this.setState({ vendorName: e.target.value });
          console.log("Add vendorName:",e.target.value);
          break;
    }
  }

  handelAddNewItem(e){
    if(this.state.vendorNo.trim() == "" || this.state.vendorName.trim() == "") {
      alert(Locales.vendor.請輸入新增項目);
    } else {
      console.log("Add vendor");
      this.setState({ showModal: false });
    }
  }

  handelDeleteItem(e,id){
    if (window.confirm('Are you sure you wish to delete this item?')) {
      console.log("Delete vendor id:",id);
    }
  }

  handleVendorModify(){
    this.setState({ showModal: true });
  }

  handleFileonload = (e) => {
    const {token} = this.props;
    //先delete遠本表中所有vendor
    let delIds=[];
    for(let i =0;i<this.state.vendorList.length;i++){
      delIds.push(this.state.vendorList[i].id);
    }
    if(delIds.length>0){
      this.doDelteteVendorList(delIds);
    }
    //讀檔add vendorList
    const content = e.target.result;
    //console.log('file content:',  content);
    let row = content.split("\r\n");
    for(let i=1 ; i< row.length ; i++){ //row 1 is header
      //console.log("data empty:"'row:', row[i]);
      let cells =  row[i].split(",");
      if(cells[0].trim()=="" || cells[1].trim()=="") {
        console.log("data empty:code:",cells[0],"name:",cells[1]);
      } else {
        let vendorItem = {type:"vendor", code:cells[0], name:cells[1], token:token};
        this.doAddVendorList(vendorItem);
      }
    }
    this.doGetVendorList();
  }

  handleFiles= (files) => {
    var reader = new FileReader();
    reader.onloadend = this.handleFileonload;
    reader.readAsText(files[0]);
  }

  doGetVendorList(){
    const {token} = this.props;
    let data = {type: "vendor", token: token};
    apiDefineList(data)
    .then(function(response) {
      if(response.data.status == 1) {
        let data = response.data.defines;
        sortByKey(data, 'code', false, true);
        this.setState({vendorList: data });
      } else if(response.data.error_code == "1009" && response.data.error_message=="Can not find define_type:'vendor'") {
        this.setState({vendorList: [] });
      } else {
        console.log("doGetVendorList response error:",response.data);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  doDelteteVendorList(arrVendorIds){
    const {token} = this.props;
    apiDefineDelete({ids:arrVendorIds, token:token})
    .then(function(response) {
      if(response.data.status == 1) {
        this.doGetVendorList();
      } else {
        console.log("vendor delete error:",response.data);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  doAddVendorList(vendorItem){
    apiDefineAdd(vendorItem)
    .then(function(response) {
      if(response.data.status == 1) {
        console.log("vendor add success:",vendorItem);
      } else {
        console.log("vendor delete error:",response.data);
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  render() {
    var height = window.innerHeight - 200;
    const columns = [
      {
        dataField: "code",
        text: Locales.vendor.廠商編號,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: "50%"
          };
        },
        style: {
          width: "50%"
        }
      },
      {
        dataField: "name",
        text: Locales.vendor.廠商名稱,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: "50%"
          };
        },
        style: {
          width: "50%"
        }
      }
    ];
    return(
      <div className="Subpage">
        <div className="WhiteBGSubpage" style={{height:height+100+"px"}}>
          <div style={{height:"40px", marginLeft:"1%"}}>
            <span className="SettingTilte">{Locales.vendor.廠商}</span>
          {/*<Button style={{float:"right",marginRight:"30px",cursor:"pointer"}} onClick={e=>this.handleOpenModal(e,{vendorNo:"",vendorName:""})}>新增廠商</Button>*/}
            <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
              <Button style={{width:"100px",float:"right",marginRight:"20px",cursor:"pointer", visibility:"hidden"}}>{Locales.common.匯入}</Button>
            </ReactFileReader>
          </div>
          <div style={{width:"98%",height:height-19+"px", overflow: "auto",overflowX:"hidden", margin:"1%"}}>
            <CompTable
              keyField="id"
              data={ this.state.vendorList }
              columns={columns}
            />
            {/* <table className='settingTable'>
              <thead className="tableHeader">
                <tr>
                  <th style={{width:"35%"}}>廠商編號</th>
                  <th style={{width:"35%"}}>廠商名稱</th>
                </tr>
              </thead>
              <tbody>
                <VendorList
                  handleDelete = {this.handelDeleteItem}
                  onShowModal={this.handleOpenModal}
                  vendorList = {this.state.vendorList}
                />
              </tbody>
            </table> */}
          </div>
          <div style={{display:this.state.showModal ? 'show':'none'}}>
            <ModalModifyItem
              onShowModal={this.handleOpenModal}
              onCloseModal={this.handleCloseModal}
              showModal={this.state.showModal}
              onAddItemClick={this.handelAddNewItem}
              onValueChanged={this.handleItemChanged}
              vendorNo={this.state.vendorNo}
              vendorName={this.state.vendorName}
            />
          </div>
        </div>
      </div>
    );
  }
}

function VendorList(props){
    let vendorData = props.vendorList;
    /*[
      {id:1,vendoeNo:"A1234567",vendoeName:"大榮貨運"},
      {id:2,vendoeNo:"A8765432",vendoeName:"忠榮貨運"},
      {id:3,vendoeNo:"A1287463",vendoeName:"小榮貨運"}
    ];*/
    return _.map(vendorData, data => {
      return (
        <tr key={data.id} className="rowDataContent">
          <td>{data.code}</td>
          <td>{data.name}</td>
        </tr>
      );
    });
}



function ModalModifyItem(props) {
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
      <div style={{fontSize: "20px"}}>{Locales.vendor.新增廠商}</div><br />
      <table width="100%" className="CorrectSubpageTable">
       <tbody>
        <tr>
          <td width="20%">{Locales.vendor.廠商編號}:</td>
          <td width="80%"><input type="text" className="InputStyle" onChange={e=>props.onValueChanged(e,'vendorNo')} value={props.vendorNo}></input></td>
        </tr>
        <tr>
          <td width="20%">{Locales.vendor.廠商名稱}:</td>
          <td width="80%"><input type="text" className="InputStyle" onChange={e=>props.onValueChanged(e,"vendorName")} value={props.vendorName}></input></td>
        </tr>
       </tbody>
      </table>
      <div style={{float: "right", marginTop: "30px"}}>
        <Button onClick={props.onCloseModal} style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>
          {Locales.common.取消}
        </Button>
        <Button onClick={e=>props.onAddItemClick(e)} style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>
          {Locales.common.確認}
        </Button>
      </div>
    </ReactModal>
  );
}

function mapStateToProps({ store, token }, ownProps) {
  return { store, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(VendorSubpage);
