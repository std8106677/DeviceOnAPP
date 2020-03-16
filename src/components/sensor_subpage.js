import React, { Component } from "react";
import { connect } from "react-redux";
import { setUpdateData } from "../actions";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import {  Row, Col } from 'reactstrap';
import { Line } from "react-chartjs-2";
import { apiLogin, apiSensorCount, apiSensorList, apiFreezerList, apiFreezerDetach,toCancelApi } from "../utils/api";
import { getSensorStatusName, sortByKey } from '../utils/common';
import { Redirect } from "react-router-dom";
import ConfirmDialog from '../components/confirm_dialog';
import {Locales} from '../lang/language';
import BlockUi from 'react-block-ui';
import {CaretComp, CaretUpComp, CaretDownComp} from '../components/comp_caret';
import moment from 'moment';
import Moment  from '../components/moment_custom'

var timeoutIndex = "";
var autoReFreshSecond = 5 * 60;
var autoReFreshCoundDown = autoReFreshSecond;
function AutoReFresh(callBackFunc) {
  autoReFreshCoundDown--;
  if(autoReFreshCoundDown < 0 && callBackFunc) {
    callBackFunc();
    autoReFreshCoundDown = autoReFreshSecond;
  }
  timeoutIndex = setTimeout(AutoReFresh, 1000, callBackFunc);
}

class SensorSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      showDataType: "lowPower",
      selectSensor: {},
      selectStore: "",
      sensorCount: [],
      sensorList: [],
      sensorData: [],
      storeMap: [],
      freezerMap: [],
      showConfirmModal: false,
      searchString: "",
      sortField: "updatetime",
      sortDesc: true,
      lastUpdateTime: "",
    };
  }

  componentWillUnmount(){
    toCancelApi();
    //clearTimeout(timeoutIndex);
  }

  componentDidMount() {
    this.dataReFresh();
    //timeoutIndex = setTimeout(AutoReFresh, 300000, this.dataReFresh);
    //document.onmousedown = this.mouseClick;
  }

  mouseClick() {
    autoReFreshCoundDown = autoReFreshSecond;
  }

  componentWillReceiveProps(nextProps) {
    //console.log("nextProps, ", nextProps);
    if(this.state.blocking == false) {
      this.getSensorCount(nextProps.store);
      if(this.state.lastUpdateTime != moment().format("YYYY/MM/DD HH:mm:ss")) {
        this.setState({lastUpdateTime: moment().format("YYYY/MM/DD HH:mm:ss")}, function() {
          this.props.setUpdateData({type: "sensor", time: this.state.lastUpdateTime});
        })
      }
    }
  }

  dataReFresh = () => {
    const {store} = this.props;
    this.getSensorCount(store);
    this.props.setUpdateData({type: "sensor", time: moment().format("YYYY/MM/DD HH:mm:ss")});
  }

  getSensorCount(store) {
    const {token} = this.props;
    var tmpStoreMap = [], storeIdList = [];
    for(var i=0 ; i<store.length ; ++i) {
      tmpStoreMap[store[i].branch_id] = store[i].branch_name;
      if(store[i].select) {
        storeIdList.push(store[i].branch_id);
      }
    }
    this.setState({storeMap: tmpStoreMap, sensorCount: []});
    //console.log("tmpStoreMap, ", tmpStoreMap);
    if(storeIdList.length > 0) {
      var data = {
        branch_ids: storeIdList,
        token: token
      }
      this.setState({blocking: true});
      apiSensorCount(data)
      .then(function (response) {
        //console.log("apiSensorCount response, ", response.data);
        if(response.data.sensor_counts && response.data.sensor_counts.length > 0) {
          this.setState({sensorCount: response.data.sensor_counts, sensorList: []});
          if(response.data.sensor_counts.length == 1) {
            this.getSensorList(response.data.sensor_counts[0].branch_id);
          }
        }
        this.setState({blocking: false});
      }.bind(this))
      .catch(function (error) {
        console.log(error);
        this.setState({blocking: false});
      }.bind(this));
    }
  }

  getSensorList(branchId) {
    this.setState({sensorList: []});
    const {token} = this.props;
    var data = {
      branch_id: branchId,
      token: token
    }
    apiFreezerList(data)
    .then(function (response) {
      var tmpMap = [];
      for(var i=0 ; i<response.data.freezers.length ; ++i) {
        tmpMap[response.data.freezers[i].freezer_id] = response.data.freezers[i].name;
      }
      this.setState({freezerMap: tmpMap}, function() {
        apiSensorList(data)
        .then(function (response) {
          var tmpSensorList = [];
          for(let i=0 ; i<response.data.sensors.length ; ++i) {
            response.data.sensors[i].updatetime = response.data.sensors[i].access_time ? response.data.sensors[i].access_time.last_data : "";
            response.data.sensors[i].freezer_name = this.getFreezerNameById(response.data.sensors[i].freezer_id);
            response.data.sensors[i].battery = this.getSensorBattery(response.data.sensors[i]);
            if(response.data.sensors[i].status != 4) {
              tmpSensorList.push(response.data.sensors[i]);
            }
          }
          this.setState({sensorList: sortByKey(tmpSensorList, this.state.sortField, this.state.sortField == "updatetime", false, this.state.sortDesc)});
        }.bind(this))
        .catch(function (error) {
          console.log(error);
        });
      });
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callDetachSensor() {
    const {token, store} = this.props;
    var data = {
      freezer_id: this.state.selectSensor.freezer_id,
      sensor_id: this.state.selectSensor.sensor_id,
      token: token
    }
    apiFreezerDetach(data)
    .then(function (response) {
      //console.log("apiFreezerDetach, ", response);
      if(response.data.status == "1") {
        this.getSensorList(this.state.selectSensor.branch_id);
        this.getSensorCount(store);
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleOpenConfirmModal = () => {
    this.setState({ showConfirmModal: true });
  }
  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false });
  }
  handleDetachSensor = () => {
    this.callDetachSensor();
    this.handleCloseConfirmModal();
  }

  getStoreNameById(storeId) {
    var name = "";
    if(this.state.storeMap[storeId]) {
      name = this.state.storeMap[storeId];
    }
    return name;
  }

  getFreezerNameById(freezerId) {
    var name = "";
    if(this.state.freezerMap[freezerId]) {
      name = this.state.freezerMap[freezerId];
    }
    return name;
  }

  handleClickSensor(e, sensor) {
    e.stopPropagation();
    //console.log("openDetailTempID, ", id);
    /*if(sensor != this.state.selectSensor) {
      this.setState({selectSensor: sensor});
    }*/
  }

  handleClickBranch(e, branchId) {
    e.stopPropagation();
    if(branchId != this.state.selectStore) {
      this.getSensorList(branchId);
      this.setState({selectStore: branchId, searchString: ""});
    }
  }

  handleClickStoreOutside(e) {
    if (JSON.stringify(this.state.selectSensor) != "{}") {
      this.setState({selectSensor: {}});
    } else if (this.state.selectStore != "") {
      this.setState({selectStore: ""});
    }
  }

  handleClickOutside(e) {
    if (this.state.selectSensor != {}) {
      this.setState({selectSensor: {}});
    }
  }

  getSensorCountByStatus(status, sensorCount) {
    var count = 0;
    switch(status) {
      case "lowPower":
        count = sensorCount.low_power;
      break;
      case "backup":
        count = sensorCount.sensor_status.backup;
      break;
      case "all":
        count = ( sensorCount.sensor_status.abnormal + sensorCount.sensor_status.backup +
                  /*sensorCount.sensor_status.delete + */sensorCount.sensor_status.idle +
                  sensorCount.sensor_status.malfunction + sensorCount.sensor_status.mobile +
                  sensorCount.sensor_status.oncalibrating + sensorCount.sensor_status.online +
                  sensorCount.sensor_status.initial);
      break;
    }
    return count;
  }

  renderInfoGrid(title, index) {
    var count=0, typeColor="white";
    for(var i=0 ; i<this.state.sensorCount.length ; ++i) {
      count += this.getSensorCountByStatus(index, this.state.sensorCount[i]);
    }
    switch(index) {
      case "lowPower": typeColor = "#FC616C"; break;
      case "backup": typeColor = "#00B5EF"; break;
      case "all": typeColor = "#82D235";
      break;
    }
    var InfoGridstyle = {maxWidth: "350px", height: "140px", marginTop: "20px", marginBottom:"15px"};
    if (index == this.state.showDataType) {
      InfoGridstyle.maxWidth = "370px";
      InfoGridstyle.height = "160px";
      InfoGridstyle.marginTop = "10px";
      InfoGridstyle.paddingTop = "15px";
      InfoGridstyle.marginBottom = "0px";
      InfoGridstyle.border = "0px";
      InfoGridstyle.color = "white";
      InfoGridstyle.backgroundColor = typeColor;
      typeColor = "white";
    }
    return (
      <Col lg={4} sm={6}>
        <div style={InfoGridstyle} className="shadow InfoGrid" onClick={() => this.setState({showDataType: index, searchString: ""})}>
          <Col style={{paddingTop: "10px", textAlign: "left", paddingLeft: "20px", height: "30px", fontSize: "22px", color: typeColor}}>
            {title}
          </Col>
          <Col style={{paddingLeft: "20px",paddingTop: "15px", textAlign: "left", fontSize: "60px", height: "80px", width: "150px"}}>
            {count}
          </Col>
        </div>
      </Col>
    );
  }

  renderDataList() {
    var count=0;
    for(var i=0 ; i<this.state.sensorCount.length ; ++i) {
      count += this.getSensorCountByStatus(this.state.showDataType, this.state.sensorCount[i]);
    }
    //console.log("this.state.sensorCount, ", this.state.sensorCount);
    if (this.state.sensorCount.length > 1 && count > 0) {
      return this.renderStoreList();
    } else if (this.state.sensorCount.length == 1 && count > 0) {
      return (
        <div>
          <div className="shadow" width="100%" style={{backgroundColor: "white"}}>
            <span style={{fontSize: "28px", padding: "20px 0 0px 30px", display: "inline-block"}}>{this.getStoreNameById(this.state.sensorCount[0].branch_id)}</span>
            <span style={{float: "right", paddingRight: "30px"}}>
              <input type="text" className="InputStyle" placeholder={Locales.sensor.請輸入欲查詢的裝置名稱或編號} value={this.state.searchString} onClick={e=>e.stopPropagation()}
                style={{width: "330px", margin: "20px 0 0 10px"}} onChange={e=>this.setState({searchString: e.target.value})}></input>
              {/*<span style={{fontSize: "48px"}}>{count}</span>
              <span style={{fontSize: "28px", paddingLeft: "10px"}}>{"筆"}</span>*/}
            </span>
            { this.renderSensorList() }
          </div>
          <br />
        </div>
      );
    }
  }

  renderStoreList() {
    return _.map(this.state.sensorCount, branch => {
      var count = this.getSensorCountByStatus(this.state.showDataType, branch);
      if (count > 0) {
        if(this.state.selectStore == branch.branch_id) {
          return (
            <div key={branch.branch_id}>
              <div className="shadow" width="100%" style={{backgroundColor: "white"}}>
                <span style={{fontSize: "28px", padding: "20px 0 0px 30px", display: "inline-block"}}>{this.getStoreNameById(branch.branch_id)}</span>
                <span style={{float: "right", paddingRight: "30px"}}>
                  <input type="text" className="InputStyle" placeholder={Locales.sensor.請輸入欲查詢的裝置名稱或編號} value={this.state.searchString} onClick={e=>e.stopPropagation()}
                    style={{width: "330px", margin: "20px 0 0 10px"}} onChange={e=>this.setState({searchString: e.target.value})}></input>
                  {/*<span style={{fontSize: "48px"}}>{count}</span>
                  <span style={{fontSize: "28px", paddingLeft: "10px"}}>{"筆"}</span>*/}
                </span>
                { this.renderSensorList() }
              </div>
              <br />
            </div>
          );
        } else {
          return (
            <div key={branch.branch_id} onClick={(e)=>this.handleClickBranch(e, branch.branch_id)}>
              <div className="shadow" width="100%" style={{backgroundColor: "white", height: "110px"}}>
                <span style={{fontSize: "28px", display: "inline-block", padding: "35px 0 0 20px"}}>{this.getStoreNameById(branch.branch_id)}</span>
                <span style={{float: "right", padding: "20px 30px 0px 0px"}}>
                  <span style={{fontSize: "48px"}}>{count}</span>
                  <span style={{fontSize: "28px", paddingLeft: "10px"}}>{Locales.common.筆}</span>
                </span>
              </div>
              <br />
            </div>
          );
        }
      }
    });
  }

  checkSensorStatus(sensor) {
    switch(this.state.showDataType) {
      case "all":
        return true;
      break;
      case "backup":
        if(sensor.status == 10) { return true; }
      break;
      case "lowPower":
        if(sensor.low_power == "true") { return true; };
      break;
    }
    return false;
  }

  checkSensorSearchString(sensor) {
    if(this.state.searchString == "") {
      return true;
    } else {
      return ~sensor.name.indexOf(this.state.searchString) || ~sensor.sensor_id.indexOf(this.state.searchString);
    }
  }

  renderSensorList() {
    let sensorlist_fixed = [], sensorlist_mobile = [];
    for(let i=0 ; i<this.state.sensorList.length ; ++i) {
      if (this.checkSensorStatus(this.state.sensorList[i])) {
        if (this.state.sensorList[i].sensor_type == "fixed") {
          sensorlist_fixed.push(this.state.sensorList[i]);
        } else if (this.state.sensorList[i].sensor_type == "mobile") {
          sensorlist_mobile.push(this.state.sensorList[i]);
        }
      }
    }
    return (
      <div>
        <div>
        { this.renderSensorListByType("fixed") }
        </div>
        <br/>
        <div>
        { this.renderSensorListByType("mobile") }
        </div>
      </div>
    );
  }

  handleClickField = (e, field) => {
    var isDateTime = (field == "updatetime") ? true : false;
    e.stopPropagation();
    if (this.state.sortField == field) {
      this.setState({sortDesc: !this.state.sortDesc}, function() {
        this.setState({sensorList: sortByKey(this.state.sensorList, field, isDateTime, false, this.state.sortDesc)})
      });
    } else {
      this.setState({sortField: field, sortDesc: true}, function() {
        this.setState({sensorList: sortByKey(this.state.sensorList, field, isDateTime, false, this.state.sortDesc)})
      });
    }
  }

  renderCaretByField(field) {
    if (this.state.sortField != field) {
      return <CaretComp/>
    } else {
      if (this.state.sortDesc == true) {
        return <CaretUpComp/>
      } else {
        return <CaretDownComp/>
      }
    }
  }

  renderSensorListByType(type) {
    var title = (type == "fixed" ? Locales.sensor.一般裝置 : Locales.sensor.車載裝置);
    var sensorlist = [];
    for(let i=0 ; i<this.state.sensorList.length ; ++i) {
      if (  this.checkSensorStatus(this.state.sensorList[i]) &&
            this.checkSensorSearchString(this.state.sensorList[i]) &&
            type == this.state.sensorList[i].sensor_type )
      {
        sensorlist.push(this.state.sensorList[i]);
      }
    }
    return (
      <div className="InfoList" onClick={(e) => this.handleClickOutside(e)}>
        <span style={{paddingLeft: "26px", paddingTop: "30px", display: "inline-block", fontSize: "18px"}}>{title}</span>
        <span style={{float: "right", padding: "20px 30px 0px 0px"}}>
          <span style={{fontSize: "48px"}}>{sensorlist.length}</span>
          <span style={{fontSize: "28px", paddingLeft: "10px"}}>{Locales.common.筆}</span>
        </span>
        <div style={{padding: "26px"}}>
          <table style={{width:"100%"}}>
            <tbody>
              <tr className="rowDataHeader sortTable">
                <td width="22%">
                  <span onClick={(e)=>this.handleClickField(e,"name")}>{Locales.sensor.裝置名稱}
                    { this.renderCaretByField("name") }
                  </span>
                </td>
                <td width="15%">
                  <span onClick={(e)=>this.handleClickField(e,"sensor_id")}>{Locales.sensor.裝置編號}
                    { this.renderCaretByField("sensor_id") }
                  </span>
                </td>
                <td width="23%">
                  <span onClick={(e)=>this.handleClickField(e,"freezer_name")}>{Locales.sensor.冷凍櫃}
                    { this.renderCaretByField("freezer_name") }
                  </span>
                </td>
                {/*<td width="15%">{Locales.sensor.門市}</td>*/}
                <td width="10%">
                  <span onClick={(e)=>this.handleClickField(e,"battery")}>{Locales.sensor.電量}
                    { this.renderCaretByField("battery") }
                  </span>
                </td>
                <td width="10%">
                  <span onClick={(e)=>this.handleClickField(e,"updatetime")}>{Locales.sensor.最近更新時間}
                    { this.renderCaretByField("updatetime") }
                  </span>
                </td>
                {/*<td width="20%">
                  <span onClick={(e)=>this.handleClickField(e,"status")}>{Locales.sensor.狀態變更時間}
                    { this.renderCaretByField("status") }
                  </span>
                </td>*/}
              </tr>
            </tbody>
            <tbody>
              { this.renderSensorDataList(sensorlist) }
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  getSensorBattery(sensor) {
    var battery = "-1";
    if(sensor && sensor.last_data && sensor.last_data.battery && typeof sensor.last_data.battery.estimated_Capacity != "undefined") {
      battery = sensor.last_data.battery.estimated_Capacity;
    }
    return battery;
  }

  renderSensorDataList(sensorlist) {
    const {user} = this.props;
    let checkOperating = false;
    if(user.user_id && user.auth_info.webpage ){
      let operatingAuth = user.auth_info.webpage.find(x=>(x.page_id =="OperatingDeviceStatus" && x.auth.indexOf("read") > -1) );
      checkOperating = operatingAuth ? true:false;
    }
    return _.map(sensorlist, sensor => {
      if (this.checkSensorStatus(sensor)) // check data type
      {
        if(sensor.sensor_id != this.state.selectSensor.sensor_id) {
          return (
            <tr key={sensor.sensor_id} className="rowDataContent" onClick={(e) => this.handleClickSensor(e, sensor)}>
              <td>{sensor.name}</td>
              <td>{sensor.sensor_id}</td>
              <td>{sensor.freezer_name}</td>
              {/*<td>{this.getStoreNameById(sensor.branch_id)}</td>*/}
              <td>{sensor.battery != "-1" ? sensor.battery + "%" : ""}</td>
              <td><Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${sensor.updatetime}`}</Moment></td>
              {/*<td>
                <span>{getSensorStatusName(sensor.status)}</span>
                <br/>
                <span>{sensor.access_time ? (<Moment style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${sensor.access_time.last_transit}`}</Moment>) : ""}</span>
              </td>*/}
            </tr>
          );
        } else {
          return (
            <tr key={sensor.sensor_id}>
							<td colSpan="6">
								<table className="SelectInfo">
                  <tbody>
                    <tr className="rowDataContent">
                      <td width="22%">{sensor.name}</td>
                      <td width="15%">{sensor.sensor_id}</td>
                      <td width="23%">{sensor.freezer_name}</td>
                      {/*<td width="15%">{this.getStoreNameById(sensor.branch_id)}</td>*/}
                      <td width="10%">{sensor.battery != "-1" ? sensor.battery + "%" : ""}</td>
                      <td width="10%"><Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${sensor.updatetime}`}</Moment></td>
                      {/*<td width="20%">
                        <span>{getSensorStatusName(sensor.status)}</span>
                        <br/>
                        <span>{sensor.access_time ? (<Moment style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${sensor.access_time.last_transit}`}</Moment>) : ""}</span>
                      </td>*/}
                    </tr>
                    <tr onClick={(e)=>this.handleClickSensor(e, sensor)}>
                      <td colSpan="6" style={{padding: "10px"}}>
                        <Tabs id="tempTabs" animation={true} className="tabStyle">
                          <Tab eventKey={"defrost"} title={Locales.common.設定}>
                            <div style={{padding: "40px 10px", textAlign: "left", minHeight: "330px"}}>
                              <Button disabled={!checkOperating} className="BtnStyle"
                                      style={{display: sensor.status == 11 || sensor.status == 12 ? "inline-block" : "none"}}
                                      onClick={this.handleOpenConfirmModal}>{Locales.sensor.停用}</Button>
                            </div>
                          </Tab>
                        </Tabs>
                      </td>
                    </tr>
                  </tbody>
  							</table>
              </td>
            </tr>
          );
        }
      }
    });
  }

  renderConfirmPauseFreezerModal() {
    if(this.state.showConfirmModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={Locales.sensor.您確定停用嗎.format( this.state.selectSensor.name )}
            confirmCB={this.handleDetachSensor}
            cancelCB={this.handleCloseConfirmModal}
          />
        </div>
      );
    }
  }

  render() {
    const {sensor, storeDepartment, store}=this.props;
    return (
      <BlockUi className={this.state.blocking ? "BlockUI" : ""} tag="div" blocking={this.state.blocking} message={Locales.common.加載中}>
        <div className="Subpage" onClick={(e) => this.handleClickStoreOutside(e)} >
          { this.renderConfirmPauseFreezerModal() }
          <Row>
            <Col>
              { this.renderInfoGrid(Locales.sensor.低電量, "lowPower") }
              { this.renderInfoGrid(Locales.sensor.解除綁定的裝置, "backup") }
              { this.renderInfoGrid(Locales.sensor.全部裝置, "all") }
            </Col>
          </Row><br />
          { this.renderDataList() }
        </div>
      </BlockUi>
    );
  }
}


function mapStateToProps({ sensor, storeDepartment, store, token, user, updateData }, ownProps) {
  return { sensor, storeDepartment, store, token, user, updateData };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setUpdateData })(SensorSubpage);
