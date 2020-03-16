import React, { Component } from "react";
import { connect } from "react-redux";
import { Button } from "react-bootstrap";
import Select from "react-select";
import filterFactory, {
  selectFilter,
  textFilter
} from "react-bootstrap-table2-filter";
import ImportExcelButton from "../components/comp_ImportExcelButton";
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import {CompTable} from "../components/comp_Table";
import ConfirmDialog from "../components/confirm_dialog";
import { apiUserList, apiUserAdd, apiUserUpdate, apiUserDelete, apiDefineList,apiUserInfo,
         apiUserChangepwd, apiUserImport, toCancelApi, apiRoleList } from "../utils/api";
import { Locales } from "../lang/language";

const emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;

const roleIDsOption = [81, 82, 91, 92];
class UserSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showConfirmModal: false,
      isCheckErr: false,
      showModal: false,
      doneModal: false,
      blockModal: false,
      successesAddCount: 0,
      failuresAddCount: 0,
      failuresAddData: [],
      failuresCheckAddData: [],
      successesUpdateCount: 0,
      failuresUpdateCount: 0,
      failuresUpdateData: [],
      failuresCheckUpdateData: [],
      successesDeleteCount: 0,
      failuresDeleteCount: 0,
      failuresDeleteData: [],
      failuresCheckDeleteData: [],
      sourceData: [],
      toDoCount: 0,
      doneCount: 0,
      interrupt: false,
      selectItem: {
        email: "",
        user_account: "",
        name: "",
        department: "",
        position: "",
        code: "",
        role_id: "",
        branch_ids: "",
        region_ids: "",
        region_pairs:{},
        user_id: 0
      },
      email: "",
      user_account: "",
      nameLast: "",
      nameFirst: "",
      chackPwd: "",
      pwd: "",
      department: "",
      position: "",
      code: "",
      role_id: "",
      branch_ids: "",
      region_ids: "",
      region_pairs:{},
      user_id: 0,
      errMsg: "",
      roleList: []
    };
    this.getUserList();
    this.getRoleList();
    if (props.storeType.length == 0) {
      // get store type list
      apiDefineList({ type: "branch_type", token: this.props.token })
      .then(function(response) {
        //console.log("store type list, ", response.data);
        this.props.setStoreType(response.data.defines);
      }.bind(this))
      .catch(function(error) {
        console.log(error);
      });
    }
    if (props.storeRegion.length == 0) {
      // get region list
      apiDefineList({ type: "region", token: this.props.token })
      .then(function(response) {
        //console.log("region list, ", response.data);
        this.props.setStoreRegion(response.data.defines);
      }.bind(this))
      .catch(function(error) {
        console.log(error);
      });
    }
  }

  componentWillUnmount() {
    toCancelApi();
  }

  getRoleList = () => {
    const { token } = this.props;
    // get Role list
    apiRoleList(token)
    .then(function(response) {
      if (response.data.status) {
        this.setState({ roleList: response.data.rolelist });
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  };

  getUserList = () => {
    const { token } = this.props;
    // get User list
    apiUserList({ token: token, user_ids: [] })
    .then(function(response) {
      const data = response.data.users;
      this.setState({
        sourceData: []
      });
      this.setState({
        sourceData: data,
        dataCount: data.length,
        showConfirmModal: false,
        isCheckErr: false,
        showModal: false,
        blockModal: false,
        errMsg: ""
      });
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  };

  setUserImport = (data, errData) => {
    const { token } = this.props;
    if(data.add.length == 0 && data.update.length == 0 && data.delete.length == 0) {
      this.setState({
        successesAddCount: 0,
        failuresAddCount: errData.add.length,
        failuresAddData: errData.add,
        successesUpdateCount: 0,
        failuresUpdateCount: errData.update.length,
        failuresUpdateData: errData.update,
        successesDeleteCount: 0,
        failuresDeleteCount: errData.delete.length,
        failuresDeleteData: errData.delete,
        doneModal: true,
        blockModal: false
      });
      this.getUserList();
      return
    }

    // get User list
    apiUserImport({ token: token, add: data.add, update: data.update, delete: data.delete })
    .then(function(response) {
      const resData = response.data;
      // console.log(errData.delete.concat(resData.delete_failed),resData.delete_failed,resData)
      if (resData.status == 1) {
        // console.log("status == 1")
        const failuresAddCount = errData.add.length + (resData.add_failed ? resData.add_failed.length : 0);
        const failuresUpdateCount = errData.update.length + (resData.update_failed ? resData.update_failed.length : 0);
        const failuresDeleteCount = errData.delete.length + (resData.delete_failed ? resData.delete_failed.length : 0);
        this.setState({
          successesAddCount: data.add.length - (failuresAddCount-errData.add.length),
          failuresAddCount: failuresAddCount,
          failuresAddData: errData.add.concat(resData.add_failed),
          successesUpdateCount: data.update.length - (failuresUpdateCount-errData.update.length),
          failuresUpdateCount: failuresUpdateCount,
          failuresUpdateData: errData.update.concat(resData.update_failed),
          successesDeleteCount: data.delete.length - (failuresDeleteCount-errData.delete.length),
          failuresDeleteCount: failuresDeleteCount,
          failuresDeleteData: errData.delete.concat(resData.delete_failed),
          doneModal: true,
          blockModal: false
        });
      } else {
        this.setState({
          doneModal: true,
          blockModal: false
        });
      }
      this.getUserList();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setUserAdd = (userData, isOne) => {
    const { token } = this.props;
    let userOldData = this.state.sourceData.find(
      u => u.user_account == userData.user_account
    );
    if (userOldData && userOldData.user_account.length > 0) {
      // this.setState({ errMsg: Locales.user.帳號重覆 });
      return;
    }
    if (
      userData.user_account === undefined ||
      userData.user_account === "" ||
      userData.email === undefined ||
      userData.email === "" ||
      userData.name === undefined ||
      userData.name === "" ||
      userData.role_id === undefined ||
      userData.role_id === "" //測試移除||
      // userData.branch_ids === undefined ||
      // userData.branch_ids.length === 0 ||
      // userData.region_ids === undefined ||
      // userData.region_ids.length === 0
    ) {
      //沒有帳號key值無法建立、修改、刪除
      //沒有角色、門店、區域，無法作業
      this.setState({ errMsg: Locales.common.請輸入必填欄位 });
      return;
    }
    apiUserAdd({ token, user: userData })
    .then(function(response) {
      if (response.data.status === 1) {
        userData.user_id = response.data.user_id;
        this.setUserChangepwd(userData);
        this.getUserList();
      } else {
        this.setState({ errMsg: response.data.error_message });
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setUserUpdate = (userData, isOne) => {
    const { token } = this.props;
    let userOldData = this.state.sourceData.find(
      u => u.user_id == userData.user_id
    );
    if (userOldData === undefined || userOldData.user_id === 0) {
      this.getUserList();
      return;
    }
    if (
      userData.user_account === undefined ||
      userData.user_account === "" ||
      userData.name === undefined ||
      userData.name === "" ||
      userData.role_id === undefined ||
      userData.role_id === "" //||//測試先移除
      // userData.branch_ids === undefined ||
      // userData.branch_ids.length === 0 ||
      // userData.region_ids === undefined ||
      // userData.region_ids.length === 0
    ) {
      //沒有帳號key值無法建立、修改、刪除
      //沒有角色、門店、區域，無法作業
      this.getUserList();
      return;
    }

    userOldData.user_account = userData.user_account;
    userOldData.email = userData.email;
    userOldData.name = userData.name;
    userOldData.role_id = userData.role_id;
    userOldData.branch_ids = userData.branch_ids;
    userOldData.region_pairs = userData.region_pairs;
    userOldData.department = userData.department;
    userOldData.position = userData.position;
    userOldData.code = userData.code;

    apiUserUpdate({ token, user: userOldData })
    .then(function(response) {
      this.setState({ doneCount: ++this.state.doneCount });
      if (response.data.status === 1) {
        if (
          userData.chackPwd &&
          userData.chackPwd.length > 0 &&
          userData.pwd == userData.chackPwd
        ) {
          this.setUserChangepwd(userData);
        }
        this.getUserList();
      } else {
        this.setState({ errMsg: response.data.error_message });
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setUserDelete = (user, isOne) => {
    const { token } = this.props;
    let userData = this.state.sourceData.find(
      u => u.user_account === user.user_account
    );
    if (userData === undefined || userData.user_id === 0) {
      this.getUserList();
      return;
    }
    apiUserDelete({ token, user_id: userData.user_id })
    .then(function(response) {
      if (response.data.status === 1) {
      } else {
      }
      if (isOne) {
        this.getUserList();
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setUserChangepwd = userData => {
    const { token } = this.props;
    apiUserChangepwd({user_id: userData.user_id, new_password: userData.pwd, token})
    .then(function(response) {
      if (response.data.status === 1) {
      } else {
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  checkTodoToDone = () => {
    const {
      toDoCount,
      doneCount,
      failuresCheckAddData,
      failuresCheckUpdateData,
      failuresCheckDeleteData
    } = this.state;
    if (
      toDoCount ===
      doneCount +
        failuresCheckAddData.length +
        failuresCheckUpdateData.length +
        failuresCheckDeleteData.length
    ) {
      this.getUserList();
      this.setState({ doneModal: true, blockModal: false });
    }
  }

  formatUserData = itemData => {
    let userData = {
      email: itemData[3],
      user_account: itemData[0],
      name: itemData[2] + itemData[1],
      firstname:itemData[2],
      lastname:itemData[1],
      department: itemData[4],
      position: itemData[5],
      code: itemData[6],
      acc_id: this.props.user.acc_id, //"Carrefour",
      role_id: itemData[7],
      branch_ids: this.getBranchIDs(itemData[9] ? itemData[9].split(",") : []),
      region_ids: itemData[8] ? itemData[8].split(",") : [],
      region_pairs:this.getRegionPairs(itemData[8] ? itemData[8].split(",") : []),
      user_id: ""
    };
    return userData;
  }

  getBranchIDs = codes => {
    let IDList = [];
    if (codes && codes.length > 0) {
      if (
        codes.indexOf("ALL") > -1 ||
        codes.indexOf("all") > -1 ||
        codes.indexOf("All") > -1
      ) {
        IDList.push("ALL");
      } else {
        if (this.props.store.length > 0) {
          codes.forEach(item => {
            let temp = this.props.store.find(
              x => x.branch_code.toUpperCase() == item.toUpperCase().trim()
            );
            if (temp) {
              IDList.push(temp.branch_id);
            }
          });
        }
      }
    }
    return IDList;
  }

  getBranchDatas = ids => {
    let nameList = [];
    if (ids && ids.length > 0 && this.props.store.length > 0) {
      if (
        ids.indexOf("ALL") > -1 ||
        ids.indexOf("all") > -1 ||
        ids.indexOf("All") > -1
      ) {
        nameList.push("ALL");
      } else {
        if (this.props.store.length) {
          ids.forEach(item => {
            let temp = this.props.store.find(
              x => x.branch_id.toUpperCase() == item.toUpperCase().trim()
            );
            if (temp) {
              nameList.push(temp.branch_code);
            }
          });
        }
      }
    }
    return nameList;
  }
  getRegionPairsDatas = ids => {
    let nameList = [];
    if (ids && ids.length > 0 &&
      this.props.storeRegion.length > 0 &&
      this.props.storeType.length > 0) {
      if (ids[0].region_id == "ALL") {
        nameList.push("ALL");
      } else {
          ids.forEach(item => {
            let region = this.props.storeRegion.find(
              x => x.id == item.region_id
            );
            let storeType = this.props.storeType.find(
              x => x.id == item.branch_type_id
            );
            if (region && storeType) {
              nameList.push(`${storeType.name}_${region.name}`);
            }
          });
      }
    }
    return nameList;
  }

  getRegionPairs = region_codes => {
    let regionIDList = [];
    if (
      region_codes &&
      region_codes.length > 0 &&
      this.props.storeRegion.length > 0 &&
      this.props.storeType.length > 0
    ) {
      if (
        region_codes.indexOf("ALL") > -1 ||
        region_codes.indexOf("all") > -1 ||
        region_codes.indexOf("All") > -1
      ) {
        regionIDList.push({branch_type_id:"ALL" ,region_id: "ALL"})
      } else {
        region_codes.forEach(item => {
          const tempArr = item.split("_");
          let typeCode = tempArr[0];
          let regionCode = "";
          if (tempArr.length > 1) {
            regionCode = tempArr[1];
          }
          let tempRegion = this.props.storeRegion.find(
            x => x.name.toUpperCase() == regionCode.toUpperCase().trim()
          );
          let tempType = this.props.storeType.find(
            x => x.name.toUpperCase() == typeCode.toUpperCase().trim()
          );
          if (tempRegion && tempType) {
            regionIDList.push({branch_type_id:tempType.id ,region_id: tempRegion.id});
          }
        });
      }
    }
    return regionIDList;
  }

  saveXls = data => {
    const {roleList,sourceData} = this.state;
    const roleIDs = roleList.map(x=>x.role_id);
    let toDoCount = 0;
    let addData = data.find(x => x.sheetName === "ADD");
    let modifyData = data.find(x => x.sheetName === "Modify");
    let deleteData = data.find(x => x.sheetName === "Delete");
    if (addData && addData.data) {
      toDoCount += addData.data.length - 1;
    }
    if (modifyData && modifyData.data) {
      toDoCount += modifyData.data.length - 1;
    }
    if (deleteData && deleteData.data) {
      toDoCount += deleteData.data.length - 1;
    }
    this.setState({
      toDoCount,
      // successesAddCount: 0,
      // failuresAddCount: 0,
      // failuresAddData: [],
      // failuresCheckAddData: [],
      // successesUpdateCount: 0,
      // failuresUpdateCount: 0,
      // failuresUpdateData: [],
      // failuresCheckUpdateData: [],
      // successesDeleteCount: 0,
      // failuresDeleteCount: 0,
      // failuresDeleteData: [],
      // failuresCheckDeleteData: [],
      // doneCount: 0,
      interrupt: false
    });
    let result = {
      add: [],
      update: [],
      delete: []
    };
    let err = {
      add: [],
      update: [],
      delete: []
    };

    data.forEach(item => {
      if (item.data !== undefined && item.data.length > 0) {
        for (const [index, itemData] of item.data.entries()) {
          if (this.state.interrupt) {
            break;
          }
          let userData = this.formatUserData(itemData);
          // console.log("userData",userData,index)
          if (index === 0) {
            //表頭不需要
            continue;
          }
          let checkData = sourceData.find(
            x => x.user_account == userData.user_account
          );
          switch (item.sheetName) {
            case "ADD":
              if (
                userData.user_account &&
                userData.user_account.length > 0 &&
                userData.role_id &&
                roleIDs.indexOf(userData.role_id) > -1 &&
                !checkData
              ) {
                result.add.push(userData);
              } else {
                err.add.push(userData.user_account);
              }
              break;
            case "Modify":
              // this.setUserUpdate(userData);
              if (
                userData.user_account &&
                userData.user_account.length > 0 &&
                userData.role_id&&
                roleIDs.indexOf(userData.role_id) > -1 &&
                checkData
              ) {
                result.update.push(userData);
              } else {
                err.update.push(userData.user_account);
              }
              break;
            case "Delete":
              // this.setUserDelete(userData);
              if (userData.user_account && userData.user_account.length > 0&& checkData) {
                result.delete.push(userData.user_account);
              } else {
                err.delete.push(userData.user_account);
              }
              break;
          }
        }
      }
    });
    // console.log(data,result);
    this.setUserImport(result, err);
  }

  handleInterruptSave = () => {
    this.setState({ interrupt: true, blockModal: false });
  }

  handledDoneCloseModal = () => {
    this.setState({ doneModal: false });
  }

  renderConfirmDeleteUserModal() {
    if (this.state.showConfirmModal) {
      return (
        <div onClick={e => e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.user.您確定刪除嗎.format(this.state.selectItem.user_account)}
            // confirmCB={this.setUserDelete(this.state.selectItem, true)}
            cancelCB={e => this.setState({ showConfirmModal: false })}
          />
        </div>
      );
    }
  }

  initData() {
    return {
      email: "",
      user_account: "",
      nameLast: "",
      nameFirst: "",
      chackPwd: "",
      pwd: "",
      department: "",
      position: "",
      code: "",
      role_id: "",
      branch_ids: "",
      region_ids: "",
      region_pairs:'',
      user_id: ""
    };
  }

  handleOpenDeleteModal = data => {
    this.setState({ showConfirmModal: true, selectItem: data });
  };
  handleOpenDeleteConfirm = () => {
    this.setUserDelete(this.state.selectItem, true);
  };
  handleOpenModal = data => {
    if (!data.user_account) {
      data = this.initData();
    }
    this.setState({
      isCheckErr: false,
      showModal: true,
      selectItem: data,
      user_account: data.user_account,
      email: data.email,
      nameLast: data.name,
      nameFirst: data.name,
      chackPwd: "",
      pwd: "",
      department: data.department,
      position: data.position,
      code: data.code,
      role_id: data.role_id,
      branch_ids: this.getBranchDatas(
        data.branch_ids.length > 0 ? data.branch_ids : []
      ),
      region_ids: this.getRegionPairsDatas(data.region_pairs.length > 0 ? data.region_pairs : []),
      user_id: data.user_id,
      errMsg: ""
    });
  };

  handleSaveModal = () => {
    const {
      user_account,
      email,
      nameLast,
      nameFirst,
      chackPwd,
      pwd,
      department,
      position,
      code,
      role_id,
      branch_ids,
      region_ids,
      user_id
    } = this.state;

    const userData = {
      user_account,
      email,
      name: nameFirst, // + nameLast,
      nameLast,
      nameFirst,
      pwd,
      chackPwd,
      department,
      acc_id: this.props.user.acc_id, //"advantech",
      position,
      code,
      role_id,
      branch_ids: this.getBranchIDs(Array.isArray(branch_ids)?branch_ids:
        branch_ids.length > 0 ? branch_ids.split(",") : []
      ),
      region_pairs:this.getRegionPairs(region_ids.length > 0 ? Array.isArray(region_ids)?region_ids:region_ids.split(",") : []),
      user_id
    };
    if (
      !user_account ||
      !email ||
      !nameFirst ||
      // !chackPwd ||
      chackPwd != pwd ||
      !role_id ||
      // !branch_ids ||
      // !region_pairs ||
      email.search(emailRule) == -1
    ) {
      this.setState({ isCheckErr: true });
      return;
    }
    if (user_id == "" && pwd) {
      this.setUserAdd(userData, true);
    } else if (user_id != "") {
      this.setUserUpdate(userData, true);
    }
  }

  handleCloseModal = () => {
    this.setState({ showModal: false });
  }

  blockSetting = () => {
    this.setState({ blockModal: true });
  }

  regionFormatter = (cell, row) => {
    let regionNameList = [];
    let notExistRegion = [];
    if (!row) {
      return;
    }
    if (
      row.region_pairs &&
      row.region_pairs.length > 0 &&
      this.props.storeRegion.length > 0 &&
      this.props.storeType.length > 0
    ) {
      if (row.region_pairs[0].region_id == "ALL") {
        regionNameList.push(Locales.user.所有區域);
      } else {
        regionNameList = this.getRegionPairsDatas(row.region_pairs.length > 0 ? row.region_pairs : [])
      }
    }
    return (
      <div>
        <span>{regionNameList.join(", ")}</span>
        {/* {regionNameList.length > 0 && notExistRegion.length > 0 && (
          <span>, </span>
        )}
        <span style={{ color: "red" }}>{notExistRegion.join(", ")}</span> */}
      </div>
    );
  };
  storeFormatter = (cell, row) => {
    if (!row) {
      return;
    }
    let store = [];
    if (Array.isArray(this.props.store)) {
      store = this.props.store;
    }
    let storeList = store.filter(x => row.branch_ids.indexOf(x.branch_id) > -1);
    let storeNameList = [];
    let notExistStore = [];
    if (row.branch_ids && row.branch_ids.length > 0) {
      if (
        row.branch_ids.indexOf("ALL") > -1 ||
        row.branch_ids.indexOf("all") > -1 ||
        row.branch_ids.indexOf("All") > -1
      ) {
        storeNameList.push(Locales.user.所有區域);
      } else {
        row.branch_ids.forEach(item => {
          let tempStore = storeList.find(x => x.branch_id == item.trim());
          if (tempStore) {
            storeNameList.push(tempStore.branch_name);
          } else {
            notExistStore.push(item);
          }
        });
      }
    }
    return (
      <div>
        <span>{storeNameList.join(", ")}</span>
        {/* {storeNameList.length > 0 && notExistStore.length > 0 && <span>, </span>}
        <span style={{ color: "red" }}>{notExistStore.join(", ")}</span> */}
      </div>
    );
  }

  buttonFormatter = (cell, row) => {
    if (!row) {
      return;
    }
    const { user } = this.props;
    const isSi = user.role_id == 91 || user.role_id == 92;
    if(roleIDsOption.indexOf(parseInt(row.role_id)) == -1|| (!isSi &&row.role_id != 81&&row.role_id != 82  ) ) {
      return " ";
    }
    return (
      <div>
        <Button onClick={() => this.handleOpenModal(row)}>
          {Locales.common.修改}
        </Button>{" "}
        <Button
          onClick={() => this.handleOpenDeleteModal(row)}
          bsClass="btn btn-danger"
        >
          {Locales.common.刪除}
        </Button>
      </div>
    );
  }

  AccOnFocus =(e)=>{
    e.preventDefault();
    const target = e.currentTarget;
    target.blur();
  }

  render() {
    const {
      successesAddCount,
      failuresAddData,
      failuresCheckAddData,
      successesUpdateCount,
      failuresUpdateData,
      failuresCheckUpdateData,
      successesDeleteCount,
      failuresDeleteData,
      failuresCheckDeleteData,
      toDoCount,
      sourceData,
      selectItem,
      isCheckErr,
      user_account,
      email,
      nameLast,
      nameFirst,
      chackPwd,
      pwd,
      department,
      position,
      code,
      role_id,
      branch_ids,
      region_ids,
      failuresAddCount,
      failuresUpdateCount,
      failuresDeleteCount,
      roleList
    } = this.state;
    let { errMsg } = this.state;
    var height = window.innerHeight - 200 + "px";
    let  viewWidth = window.innerWidth - 370;
    let addFailuresCount = failuresAddCount;
    let updateFailuresCount = failuresUpdateCount;
    let DeleteFailuresCount = failuresDeleteCount;
    let blockTitle = Locales.common.匯入中請稍候;
    // +
    // " ( " +
    // (addFailuresCount + updateFailuresCount + DeleteFailuresCount) +
    // " / " +
    // toDoCount +
    // " ) ";
    const set = new Set();
    const roleNameList = sourceData.filter(item =>
      !set.has(item.role_name) && item.role_name.length > 0
        ? set.add(item.role_name)
        : false
    );
    const roleNameListOptions = roleNameList.map(function(x, i) {
      return { value: x.role_id, label: `${x.role_name} (${x.role_id})` };
    });
    const { user } = this.props;
    const isSi = user.role_id == 91 || user.role_id == 92;
    const roleFilterData = roleList.filter(
      x => roleIDsOption.indexOf(x.role_id) > -1
    );
    let roleOptionList =
      roleNameListOptions && roleFilterData.length > 0
        ? roleFilterData.map(x => ({ value: x.role_id, label: `${x.role_name} (${x.role_id})` }))
        : [];
    const columns = [
      {
        dataField: "user_account",
        text: Locales.user.帳號,
        sort: true,
        order: 'desc',
        filter: textFilter(),
        headerStyle: () => {
          return {
            width:  `${viewWidth*25/100}px`
          };
        },
        style: {
          width:  `${viewWidth*25/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "name",
        text: Locales.user.姓名,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100}px`
          };
        },
        style: {
          width:  `${viewWidth*10/100}px`,
          wordWrap: "break-all"
        }
      },
      {
        dataField: "code",
        text: Locales.user.員工編號,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width:`${viewWidth*10/100}px`
          };
        },
        style: {
          width: `${viewWidth*10/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "role_id",
        text: Locales.user.角色,
        sort: true,
        formatter: cell =>
          roleNameListOptions.find(opt => opt.value == cell)
            ? roleNameListOptions.find(opt => opt.value == cell).label
            : "",
        filter: selectFilter({
          options: roleNameListOptions
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "region_pairs",
        text: Locales.user.區域,
        formatter: this.regionFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "branch_ids",
        text: Locales.user.門市,
        formatter: this.storeFormatter,
        headerStyle: () => {
          return {
            width:`${viewWidth*25/100+25}px`
          };
        },
        style: {
          width: `${viewWidth*25/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      }
    ];

    const siColumns = [
      {
        dataField: "user_account",
        text: Locales.user.帳號,
        sort: true,
        order: 'desc',
        filter: textFilter(),
        headerStyle: () => {
          return {
            width:`${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
          wordWrap: "break-word",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "name",
        text: Locales.user.姓名,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100}px`
          };
        },
        style: {
          width: `${viewWidth*10/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "code",
        text: Locales.user.員工編號,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100}px`
          };
        },
        style: {
          width:`${viewWidth*10/100}px`,
          wordWrap: "break-word",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "role_id",
        text: Locales.user.角色,
        sort: true,
        formatter: cell =>
          roleNameListOptions.find(opt => opt.value == cell)
            ? roleNameListOptions.find(opt => opt.value == cell).label
            : "",
        filter: selectFilter({
          options: roleNameListOptions
        }),
        headerStyle: () => {
          return {
            width:`${viewWidth*15/100}px`
          };
        },
        style: {
          width:`${viewWidth*15/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "region_pairs",
        text: Locales.user.區域,
        formatter: this.regionFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "branch_ids",
        text: Locales.user.門市,
        formatter: this.storeFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*15/100}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          wordWrap: "break-all",
          wordBreak:"break-all"
        }
      },
      {
        dataField: "",
        text: "",
        formatter: this.buttonFormatter,
        headerStyle: () => {
          return {
            width:`${viewWidth*15/100+17}px`
          };
        },
        style: {
          width: `${viewWidth*15/100}px`,
          textAlign: "center"
        }
      }
    ];
    const defaultSorted =[{
      dataField: 'user_account', // if dataField is not match to any column you defined, it will be ignored.
      order: 'asc' // desc or asc
    }];
    let chkAccCln = "InputStyle";
    let chkNameLastCln = "InputStyle";
    let chkNameFirstCln = "InputStyle";
    let chkChackPwdCln = "InputStyle";
    let chkPwdCln = "InputStyle";
    let chkRoleCln = "";
    let chkBranchCln = "InputStyle";
    let chkRegionCln = "InputStyle";
    let chkEmailCln = "InputStyle";
    let accErr = "";
    if (user_account) {
      let userOldData = this.state.sourceData.find(
        u => u.user_account == user_account
      );
      if (
        selectItem.user_account == "" &&
        userOldData &&
        userOldData.user_account.length > 0
      ) {
        accErr = Locales.user.帳號重覆;
        chkAccCln += " error";
      }
    }
    errMsg += (errMsg.length > 0 ?",":""  )+accErr;
    if (isCheckErr) {
      chkAccCln += user_account ? "" : " error";
      chkNameLastCln += nameLast ? "" : " error";
      chkNameFirstCln += nameFirst ? "" : " error";
      if (!selectItem.user_account) {
        chkChackPwdCln += chackPwd && pwd == chackPwd ? "" : " error";
        chkPwdCln += pwd && pwd == chackPwd ? "" : " error";
      }
      chkRoleCln += role_id ? "" : " error";
      //測試先移除
      // chkBranchCln += branch_ids.length > 0 ? "" : " error";
      // chkRegionCln += region_ids.length > 0 ? "" : " error";
      chkEmailCln += email ? "" : " error";
    }
    if (email) chkEmailCln += email.search(emailRule) != -1 ? "" : " error";
    return (
      <div className="Subpage">
        <div className="WhiteBGSubpage">
          <ImportExcelButton
            setData={this.saveXls}
            id="importExcel"
            blockSetting={this.blockSetting}
          />
          {isSi && (
            <Button onClick={this.handleOpenModal} style={{ width: "120px" }}>
              {Locales.common.新增}
            </Button>
          )}
          {this.state.showModal && (
            <SettingTemplateDialog
              isOpen={this.state.showModal}
              modalTitle={
                selectItem.user_account
                  ? Locales.common.修改
                  : Locales.common.新增
              }
              cancelCB={this.handleCloseModal}
              confirmCB={this.handleSaveModal}
              shouldCloseOnOverlayClick={true}
              width={"600px"}
              height={"80%"}
            >
              <table width="100%" className="CorrectSubpageTable">
                <tbody>
                  <tr>
                    <td width="30%">
                      {Locales.user.帳號}
                      <label className="required">*</label>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={chkAccCln}
                        value={user_account}
                        onChange={e =>
                          this.setState({ user_account: e.target.value })
                        }
                        // onFocus={this.AccOnFocus}
                        placeholder="  my_id@account.com"
                        readOnly={
                          selectItem.user_account &&
                          selectItem.user_account.length > 0
                        }
                        disabled={
                          selectItem.user_account &&
                          selectItem.user_account.length > 0
                        }
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.密碼}
                      {!selectItem.user_account && (
                        <label className="required">*</label>
                      )}
                    </td>
                    <td>
                      <input
                        type="password"
                        className={chkPwdCln}
                        value={pwd}
                        onChange={e => this.setState({ pwd: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.再輸入一次密碼}
                      {!selectItem.user_account && (
                        <label className="required">*</label>
                      )}
                    </td>
                    <td>
                      <input
                        type="password"
                        className={chkChackPwdCln}
                        value={chackPwd}
                        onChange={e =>this.setState({ chackPwd: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.姓名}
                      <label className="required">*</label>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={chkNameFirstCln}
                        value={nameFirst}
                        onChange={e =>
                          this.setState({ nameFirst: e.target.value })
                        }
                      />
                      {/* <div style={{ width: "35%", display: "inline-block" }}>
                        <input
                          type="text"
                          className={chkNameFirstCln}
                          value={nameFirst}
                          onChange={e =>
                            this.setState({ nameFirst: e.target.value })
                          }
                        />
                      </div>
                      <div style={{ width: "65%", display: "inline-block" }}>
                        <input
                          type="text"
                          className={chkNameLastCln}
                          value={nameLast}
                          onChange={e =>
                            this.setState({ nameLast: e.target.value })
                          }
                        />
                      </div> */}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.Email}
                      <label className="required">*</label>
                    </td>
                    <td>
                      <input
                        type="email"
                        className={chkEmailCln}
                        value={email}
                        onChange={e => this.setState({ email: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.角色}
                      <label className="required">*</label>
                    </td>
                    <td>
                      <Select
                        className={chkRoleCln}
                        options={roleOptionList}
                        placeholder={Locales.common.請選擇}
                        value={roleOptionList.filter(
                          option => option.value == role_id
                        )}
                        onChange={e => this.setState({ role_id: e.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.區域}
                      <label className="required">*</label>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={chkRegionCln}
                        value={region_ids}
                        onChange={e =>
                          this.setState({ region_ids: e.target.value })
                        }
                        placeholder="  [Hyper_TNR, Hyper_TSR]"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {Locales.user.門市}
                      <label className="required">*</label>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={chkBranchCln}
                        value={branch_ids}
                        onChange={e =>
                          this.setState({ branch_ids: e.target.value })
                        }
                        placeholder="  [LK, LJ]"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td />
                    <td style={{ color: "red" }}>{errMsg}</td>
                  </tr>
                </tbody>
              </table>
            </SettingTemplateDialog>
          )}

          {this.state.showConfirmModal && (
            <div onClick={e => e.stopPropagation()}>
              <ConfirmDialog
                content={Locales.user.您確定刪除嗎.format(
                  this.state.selectItem.user_account
                )}
                onClick={e => e.stopPropagation()}
                confirmCB={this.handleOpenDeleteConfirm}
                cancelCB={e => this.setState({ showConfirmModal: false })}
              />
            </div>
          )}
          {this.state.blockModal && (
            <SettingTemplateDialog
              isOpen={this.state.blockModal}
              modalTitle={blockTitle}
              cancelCB={this.handleInterruptSave}
              shouldCloseOnOverlayClick={false}
              confirmDisplay={false}
              width={"340px"}
              height={"130px"}
            />
          )}
          {this.state.doneModal && (
            <SettingTemplateDialog
              isOpen={this.state.doneModal}
              modalTitle={Locales.common.匯入結果}
              cancelCB={this.handledDoneCloseModal}
              confirmCB={this.handledDoneCloseModal}
              shouldCloseOnOverlayClick={true}
              width={"640px"}
              height={"80%"}
              cancelDisplay={false}
              confirmDisplay={true}
            >
              <table width="99%" className="CorrectSubpageTable ImportResult ">
                <thead>
                  <tr>
                    <th style={{ width: "100px" }}>{Locales.user.作業}</th>
                    <th>{Locales.user.結果}</th>
                  </tr>
                </thead>
                {successesAddCount == 0 &&
                  successesUpdateCount == 0 &&
                  successesDeleteCount == 0 &&
                  failuresAddData.length == 0 &&
                  failuresUpdateData.length == 0 &&
                  failuresDeleteData.length == 0 && (
                    <tbody>
                      <tr>
                        <td colSpan="2">{Locales.user.匯入失敗}</td>
                      </tr>
                    </tbody>
                  )}
                {(successesAddCount > 0 ||
                  successesUpdateCount > 0 ||
                  successesDeleteCount > 0 ||
                  failuresAddData.length > 0 ||
                  failuresUpdateData.length > 0 ||
                  failuresDeleteData.length > 0) && (
                  <tbody>
                    <tr>
                      <td rowSpan={addFailuresCount > 0 ? 3 : 2}>
                        {Locales.common.新增}
                      </td>
                      <td>
                        {Locales.user.成功筆數.format(successesAddCount)}{" "}
                      </td>
                    </tr>
                    <tr>
                      <td>{Locales.user.失敗筆數.format(addFailuresCount)}</td>
                    </tr>
                    {addFailuresCount > 0 && (
                      <tr>
                        <td>
                          {Locales.user.失敗資料}
                          <br />
                          {failuresAddData.join(", ")}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td rowSpan={updateFailuresCount > 0 ? 3 : 2}>
                        {Locales.common.修改}
                      </td>
                      <td>
                        {Locales.user.成功筆數.format(successesUpdateCount)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        {Locales.user.失敗筆數.format(updateFailuresCount)}
                      </td>
                    </tr>
                    {updateFailuresCount > 0 && (
                      <tr>
                        <td>
                          {Locales.user.失敗資料}
                          <br />
                          {failuresUpdateData.join(", ")}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td rowSpan={DeleteFailuresCount > 0 ? 3 : 2}>
                        {Locales.common.刪除}
                      </td>
                      <td>
                        {Locales.user.成功筆數.format(successesDeleteCount)}{" "}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        {Locales.user.失敗筆數.format(DeleteFailuresCount)}
                      </td>
                    </tr>
                    {DeleteFailuresCount > 0 && (
                      <tr>
                        <td>
                          {Locales.user.失敗資料}
                          <br />
                          {failuresDeleteData.join(", ")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
              </table>
            </SettingTemplateDialog>
          )}
          <div style={{ paddingTop: "10px", height: height, overflow: "auto" }}>
            {sourceData.length > 0 && (
              <CompTable
                keyField="user_id"
                data={sourceData}
                columns={isSi ? siColumns : columns}
                defaultSorted={defaultSorted}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(
  { store, token, storeType, storeRegion, user },
  ownProps
) {
  return { store, token, storeType, storeRegion, user };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(UserSubpage);
