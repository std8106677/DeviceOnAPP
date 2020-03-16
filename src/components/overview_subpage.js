import React, { Component } from "react";
import { connect } from "react-redux";
import { setPage, setStore, setUpdateData } from "../actions";
import { apiFreezerCount, apiSensorCount, toCancelApi } from "../utils/api";
import { parseStoreType, parseStoreRegion } from "../utils/common";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { Container, Row, Col } from 'reactstrap';
import BlockUi from 'react-block-ui';
import {Locales} from '../lang/language';
import moment from 'moment';

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

class OverviewSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      storeType: "",
      regionType: "",
      AreaType: "",
      storeMap: [],
      freezerCount: [],
      sensorCount: [],
      lastUpdateTime: "",
    };
  }

  componentWillUnmount(){
    toCancelApi();
    //clearTimeout(timeoutIndex);
  }

  componentDidMount() {
    //this.getSensorCount(store);
    this.dataReFresh();
    //timeoutIndex = setTimeout(AutoReFresh, 1000, this.dataReFresh);
    //document.onmousedown = this.mouseClick;
  }

  mouseClick() {
    autoReFreshCoundDown = autoReFreshSecond;
  }

  componentWillReceiveProps(nextProps) {
    //console.log("componentWillReceiveProps nextProps, ", nextProps);
    if(this.state.blocking == false) {
      this.getReducerData(nextProps.store);
      this.getFreezerCount(nextProps.store);
      //this.getSensorCount(nextProps.store);
      if(this.state.lastUpdateTime != moment().format("YYYY/MM/DD HH:mm:ss")) {
        this.setState({lastUpdateTime: moment().format("YYYY/MM/DD HH:mm:ss")}, function() {
          this.props.setUpdateData({type: "overview", time: this.state.lastUpdateTime});
        })
      }
    }
  }

  dataReFresh = () => {
    const {store} = this.props;
    this.getReducerData(store);
    this.getFreezerCount(store);
    this.props.setUpdateData({type: "overview", time: moment().format("YYYY/MM/DD HH:mm:ss")});
  }

  getReducerData(store) {
    var tmpStoreMap = [], storeTypeList = [], storeRegionList = [];
    for(var i=0 ; i<store.length ; ++i) {
      tmpStoreMap[store[i].branch_id] = store[i].branch_name;
      if(store[i].type_name && !storeTypeList.includes(store[i].type_name)) {
        storeTypeList.push(store[i].type_name);
      }
    }
    if(storeTypeList.length > 0) {
      for(var i=0 ; i<store.length ; ++i) {
        if(store[i].type_name == storeTypeList[0] && store[i].region_name && !storeRegionList.includes(store[i].region_name)) {
          storeRegionList.push(store[i].region_name);
        }
      }
    }
    storeTypeList = parseStoreType(storeTypeList);
    storeRegionList = parseStoreRegion(storeRegionList);
    this.setState({storeMap: tmpStoreMap, storeType: storeTypeList[0] || "", regionType: storeRegionList[0] || ""});
  }

  getFreezerCount(store) {
    const {token} = this.props;
    var storeIdList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name && store[i].region_name) {
        storeIdList.push(store[i].branch_id);
      }
    }
    if(storeIdList.length > 0) {
      var data = {
        branch_ids: storeIdList,
        token: token
      }
      this.setState({blocking: true});
      apiFreezerCount(data)
      .then(function (response) {
        //console.log("apiFreezerCount response, ", response.data);
        this.setState({freezerCount: response.data.freezer_counts});
        this.getSensorCount(store);
      }.bind(this))
      .catch(function (error) {
        console.log(error);
      });
    }
  }

  getSensorCount(store) {
    const {token} = this.props;
    var storeIdList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name && store[i].region_name) {
        storeIdList.push(store[i].branch_id);
      }
    }
    if(storeIdList.length > 0) {
      var data = {
        branch_ids: storeIdList,
        token: token
      }
      apiSensorCount(data)
      .then(function (response) {
        //console.log("apiFreezerCount response, ", response.data);
        this.setState({sensorCount: response.data.sensor_counts, blocking: false});
      }.bind(this))
      .catch(function (error) {
        console.log(error);
        this.setState({blocking: false});
      }.bind(this));
    }
  }

  handleClickStoreType(storeType) {
    const {store} = this.props;
    var storeRegionList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name == storeType && store[i].region_name && !storeRegionList.includes(store[i].region_name)) {
        storeRegionList.push(store[i].region_name);
      }
    }
    storeRegionList = parseStoreRegion(storeRegionList);
    this.setState({storeType: storeType, regionType: storeRegionList[0] || ""});
  }

  getTabIndexString(tab) {
    var indexString = "";
    switch(tab) {
      case "temp":
        indexString = Locales.overview.異常;
      break;
      case "uncontrolled":
        indexString = Locales.overview.未受監控;
      break;
      case "lowpower":
        indexString = Locales.overview.低電量;
      break;
    }
    return indexString;
  }

  getTabTitle(tab) {
    var title = "";
    switch(tab) {
      case "temp":
        title = Locales.overview.溫度異常的冰箱;
      break;
      case "uncontrolled":
        title = Locales.overview.未受監控的冰箱;
      break;
      case "lowpower":
        title = Locales.overview.低電量測溫裝置;
      break;
    }
    return title;
  }

  getFreezerCountTotal(freezerCount) {
    let total = 0;
    total = ( /*freezerCount.freezer_status.delete + */freezerCount.freezer_status.idle + freezerCount.freezer_status.malfunction +
              freezerCount.freezer_status.pause + freezerCount.freezer_status.abnormal + freezerCount.freezer_status.standby +
              freezerCount.freezer_status.online + freezerCount.freezer_status.initial );
    return total;
  }

  getSensorCountTotal(sensorCount) {
    let total = 0;
    total = (sensorCount.sensor_status.idle + sensorCount.sensor_status.oncalibrating +
              sensorCount.sensor_status.malfunction + /*sensorCount.sensor_status.delete +*/
              sensorCount.sensor_status.backup + sensorCount.sensor_status.mobile +
              sensorCount.sensor_status.online + sensorCount.sensor_status.abnormal + sensorCount.sensor_status.initial);
    return total;
  }

  getFreezerCountError(freezerCount, tab) {
    var errorCount = 0;
    switch(tab) {
      case "temp":
        errorCount = freezerCount.temp_status.abnormal;
      break;
      case "uncontrolled":
        errorCount = ( /*freezerCount.freezer_status.delete + */freezerCount.freezer_status.idle +
                        freezerCount.freezer_status.malfunction + freezerCount.freezer_status.pause +
                        freezerCount.freezer_status.abnormal  + freezerCount.freezer_status.standby +
                        freezerCount.freezer_status.initial );
      break;
    }
    return errorCount;
  }

  getStoreNameById(storeId) {
    const {store} = this.props;
    var name = "";
    for(let i=0 ; i<store.length ; ++i) {
      if(store[i].branch_id == storeId) {
        name = store[i].branch_name;
        break;
      }
    }
    return name;
  }

  getStoreTypeNameById(storeId) {
    const {store} = this.props;
    var type_name = "";
    for(let i=0 ; i<store.length ; ++i) {
      if(store[i].branch_id == storeId) {
        type_name = store[i].type_name;
        break;
      }
    }
    return type_name;
  }

  getStoreRegionNameById(storeId) {
    const {store} = this.props;
    var region_name = "";
    for(let i=0 ; i<store.length ; ++i) {
      if(store[i].branch_id == storeId) {
        region_name = store[i].region_name;
        break;
      }
    }
    return region_name;
  }

  getColorByIndex(index) {
    var color = "#82D235";
    switch(index) {
      case 1:
        color = "#FC616C"
      break;
      case 2:
        color = "#00B5EF"
      break;
      case 3:
        color = "#00C5B7"
      break;
      case 4:
        color = "#82D235"
      break;
    }
    return color;
  }

  changePageByStoreType(type,tab) {
    const {store} = this.props;
    var tmpStore = JSON.parse(JSON.stringify(store));
    for(var i=0 ; i<tmpStore.length ; ++i) {
      if(tmpStore[i].type_name == type) {
        tmpStore[i].select = true;
      } else {
        tmpStore[i].select = false;
      }
    }
    this.props.setStore(tmpStore);
    if (tab == "temp" || tab == "uncontrolled") {
      this.props.setPage("temp");
    } else if (tab == "lowpower") {
      this.props.setPage("sensor");
    }
  }

  changePageByStoreRegion(region,tab) {
    //console.log("changePageByStoreRegion")
    const {store} = this.props;
    var tmpStore = JSON.parse(JSON.stringify(store));
    for(var i=0 ; i<tmpStore.length ; ++i) {
      if(tmpStore[i].region_name == region && tmpStore[i].type_name == this.state.storeType) {
        tmpStore[i].select = true;
      } else {
        tmpStore[i].select = false;
      }
    }
    this.props.setStore(tmpStore);
    if (tab == "temp" || tab == "uncontrolled") {
      this.props.setPage("temp");
    } else if (tab == "lowpower") {
      this.props.setPage("sensor");
    }
  }

  changePageByStoreId(id,tab) {
    const {store} = this.props;
    var tmpStore = JSON.parse(JSON.stringify(store));
    for(var i=0 ; i<tmpStore.length ; ++i) {
      if(tmpStore[i].branch_id == id) {
        tmpStore[i].select = true;
      } else {
        tmpStore[i].select = false;
      }
    }
    this.props.setStore(tmpStore);
    if (tab == "temp" || tab == "uncontrolled") {
      this.props.setPage("temp");
    } else if (tab == "lowpower") {
      this.props.setPage("sensor");
    }
  }

  renderOverviewTab(tab) {
    const {store} = this.props;
    var title = this.getTabTitle(tab),
        indexString = this.getTabIndexString(tab),
        total = 0, errorCount = 0;
    if (tab == "temp" || tab == "uncontrolled") {
      for(var i=0 ; i<this.state.freezerCount.length ; ++i) {
        total += this.getFreezerCountTotal(this.state.freezerCount[i]);
        errorCount += this.getFreezerCountError(this.state.freezerCount[i], tab);
      }
    } else if (tab == "lowpower") {
      for(var i=0 ; i<this.state.sensorCount.length ; ++i) {
        total += this.getSensorCountTotal(this.state.sensorCount[i]);
        errorCount += this.state.sensorCount[i].low_power;
      }
    }
    var storeTypeList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name && !storeTypeList.includes(store[i].type_name)) {
        storeTypeList.push(store[i].type_name);
      }
    }
    storeTypeList = parseStoreType(storeTypeList);
    return (
      <Tab eventKey={tab} title={title}>
        <div style={{padding: "20px 0 0 0"}}>
          <div style={{color: "#FC616C"}}>
            <span>{Locales.common.總共} :</span><span style={{fontSize: "26px", fontWeight: "bold", paddingLeft: "10px"}}>{total}</span>
            <span style={{paddingLeft: "5px"}}>{Locales.common.台}</span>
            <span style={{paddingLeft: "50px"}}>{indexString} :</span><span style={{fontSize: "26px", fontWeight: "bold", paddingLeft: "10px"}}>{errorCount}</span>
            <span style={{paddingLeft: "5px"}}>{Locales.common.台}</span> (<span style={{fontSize: "26px", fontWeight: "bold", paddingLeft: "5px"}}>{(errorCount / total * 100 || 0).toFixed(0)}</span>
            <span style={{paddingLeft: "5px"}}>%</span>)
            {/* <span style={{paddingLeft: "25px"}}>{indexString + Locales.overview.占比+" :"}</span><span style={{fontSize: "26px", fontWeight: "bold", paddingLeft: "10px"}}>{(errorCount / total * 100 || 0).toFixed(0)}</span>
            <span style={{paddingLeft: "5px"}}>%</span> */}
          </div>
          <div style={{padding: "15px 0"}}>
            <span>{Locales.overview.組織型態} :</span>
          </div>
          <Container style={{width: '100%'}}>
            <Row>
              { this.renderStoreTypeList(storeTypeList, tab) }
            </Row>
          </Container>
          <div style={{paddingTop: "20px"}}>
            <span>{Locales.overview.區域}:</span>
          </div>
          <Container style={{width: '100%', paddingBottom: "20px"}}>
            <Row>
              { this.renderRegionTypeList(tab)}
            </Row>
          </Container>
          <div>
            <table style={{width:"100%", textAlign: "center"}}>
              <tbody>
                <tr className="rowDataHeader">
                  <td width="5%">#</td>
                  <td width="10%">{Locales.overview.位置}</td>
                  <td width="20%">{indexString}</td>
                  <td width="10%">{Locales.common.總數}</td>
                  <td></td>
                </tr>
              </tbody>
              <tbody>
                { this.renderStoreList(tab) }
              </tbody>
            </table>
          </div>
        </div>
      </Tab>
    );
  }

  renderStoreTypeList(typelist, tab) {
    var i=0;
    return _.map(typelist, storeType => {
      ++i;
      return (
        <Col lg={3} md={6} sm={12} key={storeType}>
          { this.renderStoreTypeGrid(storeType, i, tab) }
        </Col>
      );
    });
  }

  renderStoreTypeGrid(type, index, tab) {
    var backgroundColor, color, marginTop, paddingTop, img_arrow, paddingBottom, marginBottom;
    backgroundColor = color = this.getColorByIndex(index);
    if(type == this.state.storeType) {
      marginTop = "0px";
      paddingTop = "10px";
      paddingBottom = "10px";
      marginBottom = "0px";
      color = "white";
      img_arrow = "../img/overview_arrow_focus.svg";
    } else {
      marginTop = "10px";
      paddingTop = "0px";
      paddingBottom = "0px";
      marginBottom = "10px";
      backgroundColor = "#F3F3F3";
      img_arrow = "../img/overview_arrow.svg";
    }
    var errorCount = 0, total = 0;
    if (tab == "temp" || tab == "uncontrolled") {
      for(var i=0 ; i<this.state.freezerCount.length ; ++i) {
        if(type == this.getStoreTypeNameById(this.state.freezerCount[i].branch_id)) {
          total += this.getFreezerCountTotal(this.state.freezerCount[i]);
          errorCount += this.getFreezerCountError(this.state.freezerCount[i], tab);
        }
      }
    } else if (tab == "lowpower") {
      for(var i=0 ; i<this.state.sensorCount.length ; ++i) {
        if(type == this.getStoreTypeNameById(this.state.sensorCount[i].branch_id)) {
          total += this.getSensorCountTotal(this.state.sensorCount[i]);
          errorCount += this.state.sensorCount[i].low_power;
        }
      }
    }
    return (
      <div
        className="shadow"
        style={{ backgroundColor: backgroundColor, marginTop: marginTop, paddingTop: paddingTop, color: color, marginBottom:marginBottom, paddingBottom:paddingBottom}}
        onClick={() => this.handleClickStoreType(type)}>
        <div style={{padding:"10px 1vw 0px 1vw"}}>
          <span style={{fontSize: "1.5vw"}}>{type}</span>
          <img src={img_arrow} style={{float:"right", height:"13px", width:"16px", marginTop:"10px", cursor:"pointer"}} onClick={()=>this.changePageByStoreType(type,tab)}></img>
        </div>
        <div style={{padding:"0px 1vw"}}>
          <table width="100%">
            <tbody>
              <tr>
                <td rowSpan={2}>
                  <span style={{fontSize:"1.8vw", fontWeight:"bold"}}>{(errorCount / total * 100 || 0).toFixed(0)}%</span><br/>
                </td>
                <td>
                  <div style={{float:"right"}}>
                    <span style={{fontSize:"1.8vw", padding:"5px"}}>{errorCount}</span>
                    <span style={{fontSize:"1vw"}}>{Locales.common.台}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <span style={{float:"right", marginTop:"-8px",fontSize: "1vw"}}>{this.getTabIndexString(tab)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderRegionTypeList(tab) {
    const {store} = this.props;
    var storeTypeList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name && !storeTypeList.includes(store[i].type_name)) {
        storeTypeList.push(store[i].type_name);
      }
    }
    var storeRegionList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name == this.state.storeType && !storeRegionList.includes(store[i].region_name)) {
        storeRegionList.push(store[i].region_name);
      }
    }
    storeRegionList = parseStoreRegion(storeRegionList);
    storeTypeList = parseStoreType(storeTypeList);
    var color = this.getColorByIndex(storeTypeList.indexOf(this.state.storeType) + 1);
    return _.map(storeRegionList, region => {
      if(region != "") {
        return (
          <Col key={region} className="col-lg-1-5 col-md-1-3 col-sm-1-2 col-xs-1-1" style={{paddingTop: "10px"}}>
            { this.renderRegionTypeGrid(region, color, tab) }
          </Col>
        );
      }
    });
  }

  renderRegionTypeGrid(region, tabColor, tab) {
    var backgroundColor, color, img_arrow;
    backgroundColor = color = tabColor;
    if(region == this.state.regionType) {
      color = "white";
      img_arrow = "../img/overview_arrow_focus.svg";
    } else {
      backgroundColor = "white";
      img_arrow = "../img/overview_arrow.svg";
    }
    var errorCount = 0, total = 0;
    if (tab == "temp" || tab == "uncontrolled") {
      for(var i=0 ; i<this.state.freezerCount.length ; ++i) {
        if( this.state.storeType == this.getStoreTypeNameById(this.state.freezerCount[i].branch_id) &&
            region == this.getStoreRegionNameById(this.state.freezerCount[i].branch_id) ) {
          total += this.getFreezerCountTotal(this.state.freezerCount[i]);
          errorCount += this.getFreezerCountError(this.state.freezerCount[i], tab);
        }
      }
    } else if (tab == "lowpower") {
      for(var i=0 ; i<this.state.sensorCount.length ; ++i) {
        if( this.state.storeType == this.getStoreTypeNameById(this.state.sensorCount[i].branch_id) &&
            region == this.getStoreRegionNameById(this.state.sensorCount[i].branch_id) ) {
          total += this.getSensorCountTotal(this.state.sensorCount[i]);
          errorCount += this.state.sensorCount[i].low_power;
        }
      }
    }
    return (
      <div style={{backgroundColor: backgroundColor, color: color, border: "1px solid " + tabColor}} onClick={()=>this.setState({regionType: region})}>
        <div style={{padding:"10px 1vw 0px 1vw"}}>
          <span style={{fontSize: "1.5vw"}}>{region}</span>
          <img src={img_arrow} style={{float: "right", height: "13px", width: "16px", marginTop: "10px", cursor: "pointer"}} onClick={()=>this.changePageByStoreRegion(region,tab)}></img>
        </div>
        <div style={{padding:"0px 1vw"}}>
          <table width="100%">
            <tbody>
              <tr>
                <td rowSpan={2}>
                  <span style={{fontSize:"1.7vw", fontWeight:"bold"}}>{(errorCount / total * 100 || 0).toFixed(0)}%</span><br/>
                </td>
                <td>
                  <div style={{float:"right"}}>
                    <span style={{fontSize:"1.6vw", padding:"5px"}}>{errorCount}</span>
                    <span style={{fontSize:"1vw"}}>{Locales.common.台}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span style={{float:"right", marginTop:"-8px",fontSize: "1vw"}}>{this.getTabIndexString(tab)}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderStoreList(tab) {
    var storeList = [];
    if (tab == "temp" || tab == "uncontrolled") {
      for(let i=0 ; i<this.state.freezerCount.length ; ++i) {
        if( this.state.storeType == this.getStoreTypeNameById(this.state.freezerCount[i].branch_id) &&
            this.state.regionType == this.getStoreRegionNameById(this.state.freezerCount[i].branch_id) ) {
          storeList.push(this.state.freezerCount[i]);
        }
      }
    } else if (tab == "lowpower") {
      for(let i=0 ; i<this.state.sensorCount.length ; ++i) {
        if( this.state.storeType == this.getStoreTypeNameById(this.state.sensorCount[i].branch_id) &&
            this.state.regionType == this.getStoreRegionNameById(this.state.sensorCount[i].branch_id) ) {
          storeList.push(this.state.sensorCount[i]);
        }
      }
    }
    var i=0;
    return _.map(storeList, store => {
      var total = 0, errorCount = 0;
      if (tab == "temp" || tab == "uncontrolled") {
        errorCount = this.getFreezerCountError(store, tab);
        total = this.getFreezerCountTotal(store, tab);
      } else if (tab == "lowpower") {
        errorCount = store.low_power;
        total = this.getSensorCountTotal(store, tab);
      }
      return (
        <tr key={store.branch_id} className="rowDataContent">
          <td>{++i}</td>
          <td>{ this.getStoreNameById(store.branch_id) }</td>
          <td>{ errorCount }</td>
          <td>{ total }</td>
          <td><img src="../img/overview_arrow.svg" style={{float: "right", height: "13px", width: "16px", margin: "0px 30px 0px 0px", cursor: "pointer"}} onClick={() => this.changePageByStoreId(store.branch_id,tab)}></img></td>
        </tr>
      );
    });
  }

  render() {
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
        <div className="Subpage">
          <div className="WhiteBGSubpage">
            <Tabs id="overviewTabs" className="tabStyle" animation={false}>
              { this.renderOverviewTab("temp")}
              { this.renderOverviewTab("uncontrolled")}
              { this.renderOverviewTab("lowpower")}
            </Tabs>
          </div>
        </div>
      </BlockUi>
    );
  }
}

function mapStateToProps({ store, token, updateData }, ownProps) {
  return { store, token, updateData };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setStore, setPage, setUpdateData })(OverviewSubpage);
