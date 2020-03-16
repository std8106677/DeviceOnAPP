import React, { Component } from "react";
import { connect } from "react-redux";
import { setStore, setStoreType, setStoreRegion, setStoreDepartment } from "../actions";
import { apiBranchList, apiBranchAdd, apiBranchUpdate, apiBranchDelete, apiDefineList,
         apiDefineAdd, apiDefineUpdate, apiDefineDelete, toCancelApi } from "../utils/api";
import { sortByKey } from "../utils/common";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import Select from 'react-select';
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import ConfirmDialog from '../components/confirm_dialog';
import filterFactory, {
  selectFilter,
  textFilter
} from "react-bootstrap-table2-filter";
import {CompTable} from "../components/comp_Table";
import { Locales } from "../lang/language";

const customStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '200px',
    left: 'calc(50% - 280px)',
    right: '0px',
    bottom: '0px',
    width: '570px',
    height: '600px',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};

class StoreSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddStoreModal: false,
      showModifyStoreModal: false,
      storeID: "",
      storeName: "",
      storeCode: "",
      storeTypeID: "",
      storeRegionID: "",
      storeNote: "",
      showAddStoreTypeModal: false,
      showModifyStoreTypeModal: false,
      showAddStoreRegionModal: false,
      showModifyStoreRegionModal: false,
      showAddStoreDepartmentModal: false,
      showModifyStoreDepartmentModal: false,
      storeTypeID: "",
      storeTypeCode: "",
      storeTypeName: "",
      showAddDepartmentModal: false,

      storeNameNull: false,
      storeTypeNull: false,
      storeRegionNull: false,

      storeTypeNameNull: false,
      errorMsg:"",
      showConfirmDeleteBranchModal: false,
      confirmDeleteBranchName: "",
      confirmDeleteBranchId: "",

      showConfirmDeleteDefineTypeModal: false,
      confirmDeleteDefineTypeName: "",
      confirmDeleteDefineTypeId: "",
      confirmDeleteDefineType: ""
    };
  }

  componentWillUnmount(){
    toCancelApi();
  }

  handleOpenAddStoreModal = () => {
    this.setState({ storeID: "", storeName: "", storeCode: "", storeTypeID: "",
                    storeRegionID: "", storeNote: "", showAddStoreModal: true,
                    storeNameNull: false, storeTypeNull: false, storeRegionNull: false,errorMsg:"" }); }
  handleCloseAddStoreModal = () => { this.setState({ showAddStoreModal: false }); }

  handleOpenModifyStoreModal = (data) => {
    this.setState({ storeID: data.storeID, storeName: data.storeName, storeCode: data.storeCode,
                    storeTypeID: data.storeTypeID, storeRegionID: data.storeRegionID, storeNote: data.storeNote,
                    showModifyStoreModal: true, storeNameNull: false, storeTypeNull: false, storeRegionNull: false,errorMsg:"" }); }
  handleCloseModifyStoreModal = () => { this.setState({ showModifyStoreModal: false }); }

  handleOpenAddStoreTypeModal = () => { this.setState({ storeTypeID: "", storeTypeCode: "", storeTypeName: "", storeTypeNameNull: false, showAddStoreTypeModal: true,errorMsg:"" }); }
  handleCloseAddStoreTypeModal = () => { this.setState({ showAddStoreTypeModal: false }); }
  handleOpenModifyStoreTypeModal = (data) => {
    this.setState({ storeTypeID: data.storeTypeID, storeTypeCode: data.storeTypeCode,
                    storeTypeName: data.storeTypeName, storeTypeNameNull: false, showModifyStoreTypeModal: true });
  }
  handleCloseModifyStoreTypeModal = () => { this.setState({ showModifyStoreTypeModal: false,errorMsg:"" }); }

  handleOpenAddStoreRegionModal = () => { this.setState({ storeTypeID: "", storeTypeCode: "", storeTypeName: "", storeTypeNameNull: false, showAddStoreRegionModal: true ,errorMsg:""}); }
  handleCloseAddStoreRegionModal = () => { this.setState({ showAddStoreRegionModal: false }); }
  handleOpenModifyStoreRegionModal = (data) => {
    this.setState({ storeTypeID: data.storeTypeID, storeTypeCode: data.storeTypeCode,
                    storeTypeName: data.storeTypeName, storeTypeNameNull: false, showModifyStoreRegionModal: true,errorMsg:"" });
  }
  handleCloseModifyStoreRegionModal = () => { this.setState({ showModifyStoreRegionModal: false }); }

  handleOpenAddStoreDepartmentModal = () => { this.setState({ storeTypeID: "", storeTypeCode: "", storeTypeName: "", storeTypeNameNull: false, showAddStoreDepartmentModal: true }); }
  handleCloseAddStoreDepartmentModal = () => { this.setState({ showAddStoreDepartmentModal: false }); }
  handleOpenModifyStoreDepartmentModal = (data) => {
    this.setState({ storeTypeID: data.storeTypeID, storeTypeCode: data.storeTypeCode,
                    storeTypeName: data.storeTypeName, storeTypeNameNull: false, showModifyStoreDepartmentModal: true });
  }
  handleCloseModifyStoreDepartmentModal = () => { this.setState({ showModifyStoreDepartmentModal: false }); }

  handleOpenAddDepartmentModal = () => { this.setState({ showAddDepartmentModal: true }); }
  handleCloseAddDepartmentModal = () => { this.setState({ showAddDepartmentModal: false }); }

  handleOpenConfirmDeleteBranchModal = (data) => {
    this.setState({ showConfirmDeleteBranchModal: true, confirmDeleteBranchName: data.branch_name, confirmDeleteBranchId: data.branch_id });
  }
  handleCloseConfirmDeleteBranchModal = () => {
    this.setState({ showConfirmDeleteBranchModal: false, confirmDeleteBranchName: "", confirmDeleteBranchId: "" });
  }

  handleOpenConfirmDeleteDefineTypeModal = (type, data) => {
    this.setState({ showConfirmDeleteDefineTypeModal: true, confirmDeleteDefineType: type, confirmDeleteDefineTypeName: data.name, confirmDeleteDefineTypeId: data.id });
  }
  handleCloseConfirmDeleteDefineTypeModal = () => {
    this.setState({ showConfirmDeleteDefineTypeModal: false, confirmDeleteDefineType: "", confirmDeleteDefineTypeName: "", confirmDeleteDefineTypeId: "" });
  }

  // ======= api ======= //
  getBranchList = () => {
    const {token} = this.props;
    this.props.setStore([]);
    apiBranchList(token)
    .then(function(response) {
      var tmpBranchList = [], select = false;
      for(var i=0 ; i<response.data.branchs.length ; ++i) {
        if(response.data.branchs[i].status != 4) {
          if(select == false) {
            select = true;
            response.data.branchs[i].select = true;
          } else {
            response.data.branchs[i].select = false;
          }
          tmpBranchList.push(response.data.branchs[i]);
        }
      }
      this.props.setStore(sortByKey(tmpBranchList, "branch_name"));
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  addBranch = () => {
    if(this.state.storeName == "" || this.state.storeTypeID == "" || this.state.storeRegionID == "") {
      this.setState({storeNameNull: this.state.storeName == ""});
      this.setState({storeTypeNull: this.state.storeTypeID == ""});
      this.setState({storeRegionNull: this.state.storeRegionID == ""});
      return;
    }
    const {token} = this.props;
    var data = {
      name: this.state.storeName,
      code: this.state.storeCode,
      type: this.state.storeTypeID,
      region: this.state.storeRegionID,
      note: this.state.storeNote,
      token: token
    }
    apiBranchAdd(data)
    .then(function(response) {
      this.getBranchList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
    this.handleCloseAddStoreModal();
  }

  updateBranch = () => {
    if(this.state.storeName == "" || this.state.storeTypeID == "" || this.state.storeRegionID == "") {
      this.setState({storeNameNull: this.state.storeName == ""});
      this.setState({storeTypeNull: this.state.storeTypeID == ""});
      this.setState({storeRegionNull: this.state.storeRegionID == ""});
      return;
    }
    const {token} = this.props;
    var data = {
      id: this.state.storeID,
      name: this.state.storeName,
      code: this.state.storeCode,
      type: this.state.storeTypeID,
      region: this.state.storeRegionID,
      note: this.state.storeNote,
      token: token
    }
    apiBranchUpdate(data)
    .then(function(response) {
      this.getBranchList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
    this.handleCloseModifyStoreModal();
  }

  handleDeleteBranch = () => {
    const {token} = this.props;
    var data = {
      branch_id: this.state.confirmDeleteBranchId,
      token: token
    };
    apiBranchDelete(data)
    .then(function(response) {
      this.getBranchList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
    this.handleCloseConfirmDeleteBranchModal();
  }

  handleDeleteDefineType = () => {
    const {token} = this.props;
    var ids = [];
    ids.push(this.state.confirmDeleteDefineTypeId);
    var data = {
      ids: ids,
      token: token
    }
    var type = this.state.confirmDeleteDefineType;
    apiDefineDelete(data)
    .then(function(response) {
      this.getDefineTypeList(type);
      this.getBranchList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
    this.handleCloseConfirmDeleteDefineTypeModal();
  }

  getDefineTypeList = (type) => {
    const {token} = this.props;
    let data = {type: type, token: token};
    apiDefineList(data)
    .then(function(response) {
      if (type == "branch_type") {
        this.props.setStoreType(sortByKey(response.data.defines, "name"));
      } else if (type == "region") {
        this.props.setStoreRegion(sortByKey(response.data.defines, "name"));
      } else if (type == "department") {
        this.props.setStoreDepartment(sortByKey(response.data.defines, "name"));
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  addStoreType = (type) => {
    if(this.state.storeTypeName == "") {
      this.setState({storeTypeNameNull: true});
      return;
    }
    let isExist = false;
    switch (type){
      case "branch_type":
      isExist = this.props.storeType.filter( x=> x.name == this.state.storeTypeName).length > 0;
      break;
      case "region":
      isExist = this.props.storeRegion.filter( x=> x.name == this.state.storeTypeName).length > 0;
      break;
    }
    if(isExist){
      this.setState({storeTypeNameNull: true,errorMsg:Locales.common.名稱重覆});
      return
    }
    const {token} = this.props;
    var dataValue = {
      type: type,
      code: this.state.storeTypeCode,
      name: this.state.storeTypeName,
      token: token
    }
    apiDefineAdd(dataValue)
    .then(function(response) {
      this.getDefineTypeList(type);
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
    if (type == "branch_type") {
      this.handleCloseAddStoreTypeModal();
    } else if (type == "region") {
      this.handleCloseAddStoreRegionModal();
    } else if (type == "department") {
      this.handleCloseAddStoreDepartmentModal();
    }
  }

  updateStoreType = (type) => {
    if(this.state.storeTypeName == "") {
      this.setState({storeTypeNameNull: true});
      return;
    }
    const {token} = this.props;
    var data = {
      type: type,
      id: this.state.storeTypeID,
      code: this.state.storeTypeCode,
      name: this.state.storeTypeName,
      token: token
    }
    apiDefineUpdate(data)
    .then(function(response) {
      this.getDefineTypeList(type);
      this.getBranchList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
    if (type == "branch_type") {
      this.handleCloseModifyStoreTypeModal();
    } else if (type == "region") {
      this.handleCloseModifyStoreRegionModal();
    } else if (type == "department") {
      this.handleCloseModifyStoreDepartmentModal();
    }
  }
  // ======= api ======= //

  buttonFormatter = (cell, row) => {
    var storeData = {
      storeID: row.branch_id,
      storeName: row.branch_name,
      storeCode: row.branch_code,
      storeTypeID: row.type_id,
      storeRegionID: row.region_id,
      storeNote: row.descr
    }
    return (
      <div>
        <Button style={{marginRight: "10px"}} onClick={()=>this.handleOpenModifyStoreModal(storeData)}>{Locales.common.修改}</Button>
        <Button onClick={()=>this.handleOpenConfirmDeleteBranchModal(row)} bsClass="btn btn-danger">{Locales.common.刪除}</Button>
      </div>
    );
  };

  StoreTab() {
    const {store} = this.props;
    var height = (window.innerHeight - 270) + "px";
    const set = new Set();
    const typeList = store.length? store.filter(item =>
      !set.has(item.type_id)
        ? set.add(item.type_id)
        : false
    ):[];
    let typeNameListOptions = typeList.map(function(x, i) {
      return { value: x.type_id, label: x.type_name };
    });
    if(typeNameListOptions.length == 0){
      typeNameListOptions = [{ value: 0, label: ""}]
    }
    const regionList = store.length? store.filter(item =>
      !set.has(item.region_id)
        ? set.add(item.region_id)
        : false
    ):[];
    let regionNameListOptions = regionList.map(function(x, i) {
      return { value: x.region_id, label: x.region_name };
    });
    if(regionNameListOptions.length == 0){
      regionNameListOptions = [{ value: 0, label: ""}]
    }
    let  viewWidth = window.innerWidth - 370;
    const columns = [
      {
        dataField: "branch_name",
        text: Locales.store.門市名稱,
        sort: true,
        filter: textFilter(),
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
        dataField: "type_id",
        text: Locales.store.門市型態,
        sort: true,
        formatter: cell => typeNameListOptions.find(opt => opt.value == cell)
        ? typeNameListOptions.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  typeNameListOptions
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
        dataField: "branch_id",
        text: Locales.store.門市ID,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*12/100}px`
          };
        },
        style: {
          width: `${viewWidth*12/100}px`
        }
      },
      {
        dataField: "branch_code",
        text: Locales.store.門市代碼,
        filter: textFilter(),
        sort: true,
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
        dataField: "region_id",
        text: Locales.store.區域,
        sort: true,
        formatter: cell => regionNameListOptions.find(opt => opt.value == cell)
        ? regionNameListOptions.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options: regionNameListOptions
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
        dataField: "descr",
        text: Locales.store.註記,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`
        }
      },
      {
        dataField: "acc_id",
        text: "",
        formatter: this.buttonFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*13/100+25}px`
          };
        },
        style: {
          width: `${viewWidth*13/100}px`,
          textAlign: "center"
        }
      }
    ];
    const defaultSorted =[{
      dataField: 'branch_name', // if dataField is not match to any column you defined, it will be ignored.
      order: 'asc' // desc or asc
    }];
    return (
      <div style={{paddingTop: "20px"}}>
        <Button onClick={()=>this.handleOpenAddStoreModal()}>{Locales.store.新增門市}</Button>
        { this.StoreModal(Locales.store.新增門市, this.state.showAddStoreModal, this.handleCloseAddStoreModal, this.addBranch) }
        { this.StoreModal(Locales.store.修改門市, this.state.showModifyStoreModal, this.handleCloseModifyStoreModal, this.updateBranch) }
        <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
         {store.length > 0 && <CompTable
            keyField="branch_id"
            data={store}
            columns={columns}
            defaultSorted={defaultSorted}
          />}
        </div>
      </div>
    );
  }

  StoreModal(title, isOpen, handleClodeModal, handleCallAPI) {
    const { storeType, storeRegion } = this.props;
    var storeTypes = [], storeRegions = [];
    for(let i=0 ; i<storeType.length ; ++i) {
      storeTypes.push({value: storeType[i].id, label: storeType[i].name});
    }
    for(let i=0 ; i<storeRegion.length ; ++i) {
      storeRegions.push({value: storeRegion[i].id, label: storeRegion[i].name});
    }
    let maxMenuHeight = 300;
    if (window.innerHeight < 768){
      maxMenuHeight = 90;
    }
    return (
      <SettingTemplateDialog
        isOpen={isOpen}
        modalTitle={title}
        cancelCB={() =>handleClodeModal()}
        confirmCB={() => handleCallAPI()}
        height={"75%"}
        shouldCloseOnOverlayClick={true} >
        <table width="100%" className="CorrectSubpageTable">
          <tbody>
            <tr>
              <td width="30%">{Locales.store.門市名稱}<label className="required">*</label></td>
              <td><input type="text" className="InputStyle" style={this.state.storeNameNull ? {borderColor: "red"} : {}} value={this.state.storeName} onChange={e=>this.setState({storeName: e.target.value})}></input></td>
            </tr>
              <tr>
                <td width="30%">{Locales.store.門市代碼}</td>
                <td><input type="text" className="InputStyle" value={this.state.storeCode} onChange={e=>this.setState({storeCode: e.target.value})}></input></td>
              </tr>
            <tr>
              <td>{Locales.store.門市型態}<label className="required">*</label></td>
              <td><Select options={storeTypes} className={this.state.storeTypeNull ? "error" : ""} placeholder={Locales.common.請選擇} value={storeTypes.filter(option=>option.value==this.state.storeTypeID)} onChange={e=>this.setState({storeTypeID: e.value})} maxMenuHeight={maxMenuHeight}/></td>
            </tr>
            <tr>
              <td>{Locales.store.區域}<label className="required">*</label></td>
              <td><Select options={storeRegions} className={this.state.storeRegionNull ? "error" : ""} placeholder={Locales.common.請選擇} value={storeRegions.filter(option=>option.value==this.state.storeRegionID)} onChange={e=>this.setState({storeRegionID: e.value})} maxMenuHeight={maxMenuHeight}/></td>
            </tr>
            <tr>
              <td>{Locales.store.註記}</td>
              <td><input type="text" className="InputStyle" value={this.state.storeNote} onChange={e=>this.setState({storeNote: e.target.value})}></input></td>
            </tr>
          </tbody>
        </table>
      </SettingTemplateDialog>
    );
  }

  StoreTabData() {
    const { store }=this.props;
    return _.map(store, data => {
      var storeData = {
        storeID: data.branch_id,
        storeName: data.branch_name,
        storeCode: data.branch_code,
        storeTypeID: data.type_id,
        storeRegionID: data.region_id,
        storeNote: data.descr
      }
      return (
        <tr key={Math.random()} className="rowDataContent">
          <td>{data.branch_name}</td>
          <td>{data.type_name}</td>
          <td>{data.branch_id}</td>
          <td>{data.branch_code}</td>
          <td>{data.region_name}</td>
          <td>{data.descr}</td>
          <td>
            <Button style={{marginRight: "10px"}} onClick={()=>this.handleOpenModifyStoreModal(storeData)}>{Locales.common.修改}</Button>
            <Button onClick={()=>this.handleOpenConfirmDeleteBranchModal(data)} bsClass="btn btn-danger">{Locales.common.刪除}</Button>
          </td>
        </tr>
      );
    });
  }

  StoreTypeTab() {
    const { storeType }=this.props;
    var height = (window.innerHeight - 300) + "px";
    return (
      <div style={{paddingTop: "20px"}}>
        <Button onClick={()=>this.handleOpenAddStoreTypeModal()}>{Locales.store.新增組織型態}</Button>
        {this.StoreTypeModal("branch_type", Locales.store.新增組織型態, Locales.store.組織型態名稱, this.state.showAddStoreTypeModal, this.handleCloseAddStoreTypeModal, this.addStoreType)}
        {this.StoreTypeModal("branch_type", Locales.store.修改組織型態, Locales.store.組織型態名稱, this.state.showModifyStoreTypeModal, this.handleCloseModifyStoreTypeModal, this.updateStoreType)}
        <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
          {this.StoreTypeData(storeType, "branch_type", this.handleOpenModifyStoreTypeModal)}
        </div>
      </div>
    );
  }

  StoreRegionTab() {
    const { storeRegion }=this.props;
    var height = (window.innerHeight - 300) + "px";
    return (
      <div style={{paddingTop: "20px"}}>
        <Button onClick={()=>this.handleOpenAddStoreRegionModal()}>{Locales.store.新增區域}</Button>
        {this.StoreTypeModal("region", Locales.store.新增區域, Locales.store.區域名稱, this.state.showAddStoreRegionModal, this.handleCloseAddStoreRegionModal, this.addStoreType)}
        {this.StoreTypeModal("region", Locales.store.修改區域, Locales.store.區域名稱, this.state.showModifyStoreRegionModal, this.handleCloseModifyStoreRegionModal, this.updateStoreType)}
        <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
          {this.StoreTypeData(storeRegion, "region", this.handleOpenModifyStoreRegionModal)}
        </div>
      </div>
    );
  }

  StoreDepartmentTab() {
    const { storeDepartment }=this.props;
    var height = (window.innerHeight - 300) + "px";
    return (
      <div style={{paddingTop: "20px"}}>
        <Button onClick={()=>this.handleOpenAddStoreDepartmentModal()}>{Locales.store.新增部門}</Button>
        {this.StoreTypeModal("department", Locales.store.部門區域, Locales.store.部門名稱, this.state.showAddStoreDepartmentModal, this.handleCloseAddStoreDepartmentModal, this.addStoreType)}
        {this.StoreTypeModal("department", Locales.store.部門區域, Locales.store.部門名稱, this.state.showModifyStoreDepartmentModal, this.handleCloseModifyStoreDepartmentModal, this.updateStoreType)}
        <div style={{paddingTop: "10px", height: height, overflow: "auto"}}>
          {this.StoreTypeData(storeDepartment, "department", this.handleOpenModifyStoreDepartmentModal)}
        </div>
      </div>
    );
  }

  StoreTypeModal(type, title, field1, isOpen, handleClodeModal, handleCallAPI) {
    const { storeType, storeRegion }=this.props;
    const storeTypes = [], storeRegions = [];
    for(var i=0 ; i<storeType.length ; ++i) {
      storeTypes.push({value: storeType[i].id, label: storeType[i].name});
    }
    for(var i=0 ; i<storeRegion.length ; ++i) {
      storeRegions.push({value: storeRegion[i].id, label: storeRegion[i].name});
    }
    return (
      <SettingTemplateDialog
        isOpen={isOpen}
        modalTitle={title}
        cancelCB={() =>handleClodeModal()}
        confirmCB={() => handleCallAPI(type)}
        shouldCloseOnOverlayClick={true} >
        <table width="100%" className="CorrectSubpageTable">
          <tbody>
            <tr>
              <td width="30%">{field1}<label className="required">*</label></td>
              <td>
                <input type="text" className="InputStyle" style={this.state.storeTypeNameNull ? {borderColor: "red"} : {}}
                       value={this.state.storeTypeName} onChange={e=>this.setState({storeTypeName: e.target.value})}></input>
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{color:"red"}}>{this.state.errorMsg}</td>
            </tr>
          </tbody>
        </table>
      </SettingTemplateDialog>
    );
  }

  StoreTypeData(datalist, type, handleOpenModifyModal) {
    return _.map(datalist, data => {
      var storeTypeData = {
        storeTypeID: data.id,
        storeTypeCode: data.code,
        storeTypeName: data.name
      }
      return (
        <div key={Math.random()} style={{paddingRight: "10px"}}>
          <div style={{width: "100%", lineHeight: "50px", border: "1px solid #C3C3C3"}}>
            <span style={{verticalAlign: "middle", marginLeft: "15px"}}>{data.name}</span>
            <div style={{float: "right"}}>
              <Button style={{marginRight: "15px"}} onClick={()=>handleOpenModifyModal(storeTypeData)}>{Locales.store.修改名稱}</Button>
              <Button style={{marginRight: "15px"}} onClick={()=>this.handleOpenConfirmDeleteDefineTypeModal(type, data)} bsClass="btn btn-danger">{Locales.common.刪除}</Button>
            </div>
          </div>
          <br/>
        </div>
      );
    });
  }

  renderConfirmDeleteBranchModal() {
    if(this.state.showConfirmDeleteBranchModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.common.您確定刪除嗎.format( this.state.confirmDeleteBranchName )}
            confirmCB={this.handleDeleteBranch}
            cancelCB={this.handleCloseConfirmDeleteBranchModal}
          />
        </div>
      );
    }
  }

  renderConfirmDeleteDefineTypeModal() {
    if(this.state.showConfirmDeleteDefineTypeModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.common.您確定刪除嗎.format( this.state.confirmDeleteDefineTypeName )}
            confirmCB={this.handleDeleteDefineType}
            cancelCB={this.handleCloseConfirmDeleteDefineTypeModal}
          />
        </div>
      );
    }
  }

  render() {
    return (
      <div className="Subpage">
        <div className="WhiteBGSubpage">
          { this.renderConfirmDeleteBranchModal() }
          { this.renderConfirmDeleteDefineTypeModal() }
          <Tabs id="storeBackendTabs" className="tabStyle" animation={false}>
            <Tab eventKey={"store"} title={Locales.store.門市}>
              {this.StoreTab()}
            </Tab>
            <Tab eventKey={"storeType"} title={Locales.store.組織型態}>
              {this.StoreTypeTab()}
            </Tab>
            <Tab eventKey={"storeRegion"} title={Locales.store.區域}>
              {this.StoreRegionTab()}
            </Tab>
            <Tab eventKey={"storeDepartment"} title={Locales.store.部門}>
              {this.StoreDepartmentTab()}
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}

function mapStateToProps({ store, storeType, storeRegion, storeDepartment, token }, ownProps) {
  return { store, storeType, storeRegion, storeDepartment, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setStore, setStoreType, setStoreRegion, setStoreDepartment })(StoreSubpage);
