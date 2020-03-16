import React, { Component } from "react";
import moment from 'moment';
import { connect } from "react-redux";
import { setUser,setAbnormalList,setAbnormalFilter } from "../actions";
import { Panel,PanelGroup,Tab, Tabs, Button,Form, FormGroup, FormControl, ControlLabel,Col, MenuItem, Dropdowns} from "react-bootstrap";
import Select from 'react-select';
import NumericInput from 'react-numeric-input';
import BootstrapTable from 'react-bootstrap-table-next';
import {apiDefineList,apiFreezerInfo,apiFreezerPropertyList,apiDataRetrieve,apiFreezerList,
  apiAlertRecordList,apiAlertRecordInfo,apiAlertRecordAdd,apiFreezerPause,apiFreezerPropertyUpdate,apiSensorDisable,toCancelApi} from "../utils/api";
import {hasKey, sortByKey,padLeft,sortByHans,pageStore,showRowNum} from "../utils/common";
import { Redirect } from "react-router-dom";
import ReactModal from 'react-modal';
import Moment  from '../components/moment_custom'
import {Doughnut, Bar, Line} from "react-chartjs-2";
import "chartjs-plugin-annotation";
import DateRangePicker from "../components/comp_DateRangeFilter";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import {Locales} from '../lang/language';
import BlockUi from 'react-block-ui';
import {CompSearchedTable} from "../components/comp_Table";

class AbnormalSubpage extends Component {
  constructor(props) {
    super(props);
    this.token = props.token;
    this.dropdownReason = [];
    this.dropdownResult = [];
    this.dropdownResultCon = [];
    this.dropdownResultAct = [];
    this.g_abnormalList = this.props.abnormallist;
    this.dicFreezers = [];
    //this.showRowNum = 20;
    this.selStoreCount=0;
    this.countList=0;
    this.doGetDefineList("abnormal_reason");
    this.doGetDefineList("abnormal_result");
    this.doGetDefineList("abnormal_result_condition");
    this.doGetDefineList("adnormal_action");
    this.handleSelect = this.handleSelect.bind(this);
    this.state={
      abnormalList:(this.g_abnormalList.length > showRowNum )?this.g_abnormalList.slice(0,showRowNum ):this.g_abnormalList,
      total:0,
      abnormalTypeCount:[0,0,0],
      expandRowId:null,
      activeKey: '1',
      showModal: false,
      modalType:"",
      selReason:{},
      selResult:{},
      showInput:false,
      showInputType:"",
      selPausePeriod:0,
      dropdownResult:[],
      otherInput:"",
      //除霜設定
      selDefrostHr:0,
      selDefrostMin:0,
      defrostSch:"",
      freezerInfo:{},
      defrostFreq:4,
      freezerPropId:"",
      //more Button
      showLastIndex:showRowNum,
      showMoreButton:(this.g_abnormalList.length > showRowNum )?true:false,
      alertRecord:[],
      checkData:false,
      freezerTempRecord:[] //事件發生溫度紀錄
    };
  }
  componentWillUnmount(){
    toCancelApi();
  }

  componentWillReceiveProps(nextProps) {
    //console.log("store:",this.props.store);
    //console.log("componentWillReceiveProps:",nextProps);
    //console.log("searchfilter",this.props.searchfilter);
    this.token = nextProps.token;
    let isChanged = false;

    const {filterabnoraml, store,storeDepartment} = nextProps;

    //console.log("start:",startTime," end:",endTime);
    //console.log("storeDepartment:",storeDepartment);
    if(typeof store === "object" && (store instanceof Array)){
      let selstores = store.filter(s => s.select == true);
      this.selStoreCount = selstores.length;
      //let preselstores = this.props.store.filter(s => s.select == true);

      let seldepart = storeDepartment.filter(d => d.select == true);
      //let preseldepart = this.props.storeDepartment.filter(d => d.select == true);
      if(!Object.compare(selstores,pageStore.abnormal.selStores) || !Object.compare(seldepart ,pageStore.abnormal.selDpt)){
        pageStore.abnormal.selStores=selstores;
        pageStore.abnormal.selDpt=seldepart;
        isChanged = true;
      }
      //console.log("selstores:",selstores);
      //console.log("this.props.filterabnoraml.SelStores:",this.props.filterabnoraml.SelStores);

      if(filterabnoraml.doSearch ||
        (this.props.filterabnoraml.From != filterabnoraml.From
          || this.props.filterabnoraml.To != filterabnoraml.To )
          //|| !Object.compare(selstores,this.props.filterabnoraml.SelStores)
          //|| !Object.compare(seldepart , this.props.filterabnoraml.SelDepart)
        ){
            //console.log("this.props.filterabnoraml.SelDepart:",this.props.filterabnoraml.SelDepart);
            //console.log("seldepart:",seldepart); 
            isChanged = true;
            this.props.setAbnormalFilter({From:filterabnoraml.From,To:filterabnoraml.To, Filter:filterabnoraml.Filter, FilterType:filterabnoraml.FilterType,doSearch:false});
      }
      let startTime = (typeof filterabnoraml.From!="undefined")? filterabnoraml.From : moment().add('-6','days').format('YYYY-MM-DD HH:mm:ss');
      let endTime = (typeof filterabnoraml.To!="undefined")? filterabnoraml.To : moment().format('YYYY-MM-DD HH:mm:ss');
      //console.log("isChanged",isChanged);
      if(isChanged){
        this.setState({blocking: true});
        this.g_abnormalList = [];
        this.countList=0;
        if(selstores.length == 0){
          this.setState({abnormalList:this.g_abnormalList,blocking:false,showMoreButton:false});
          this.props.setAbnormalList(this.g_abnormalList);
        }
        _.map(selstores, item =>{
          let data = {branch_id:item.branch_id,token:this.token};
          apiFreezerList(data).then(response=>{
            let freezers = response.data.freezers;
            _.map(freezers, freezer=>{
              if(typeof this.dicFreezers[freezer.freezer_id] == "undefined"){
                this.dicFreezers[freezer.freezer_id] = freezer;
              }
            });
          })
          this.doGetAbnormalList(item.branch_id,item.branch_name,startTime, endTime);
        });
      }
    }
    //this.doGetAbnormalList("claireyu","Test",startTime, endTime);
    //this.doGetTransportList("rrn5eh8u","test",startTime, endTime, searchfilter);
  }

  handleSelect(activeKey) {
    this.setState({ activeKey:activeKey });
  }

  async handleExpandRow(e, row) {
    this.setState({dropdownResult:this.dropdownResult});
    //this.setState({alertRecord:""});

    //e.stopPropagation();
    //console.log("ExpandRow:", row);
    if(row.id != this.state.expandRowId) {
      let alertRecord = await this.doGetAlertRecord(row.id);
      this.doGetFreezerPropList(row.freezerId);//判斷除霜
      let freezerInfo = await this.doGetFreezerInfo(row.freezerId);//判斷冰箱溫度是否恢復正常
      let temp = [];
      _.map(this.state.dropdownResult, result=>{
        let condition = this.dropdownResultCon.filter(con => {
          return con.id == result.extension.abnormal_result_condition_id;
        });
        //console.log("dropdownResultCon",this.dropdownResultCon);
        //console.log("condition",condition);
        //溫度異常:temp_status==151; 150,152:正常 被刪除的冰箱:status==4
        if(condition.length>0 && condition[0].code == "1" && freezerInfo.temp_status==151){
            //溫度恢復正常不放入下拉選單
            console.log("溫度仍異常");
          }else{
            temp.push(result);
          }
      });
      this.setState({dropdownResult:temp,expandRowId: row.id,alertRecord:alertRecord,freezerInfo:row.freezerInfo});
      console.log("event time:",row.happenedTime)
      this.doGetFreezerTempRecord(row.freezerId,row.happenedTime,row.freezerStandardDegree);
      //this.setState({expandRowId: row.id,alertRecord:row.alertRecord,freezerInfo:row.freezerInfo});
      //this.setState({alertRecord:row.alertRecord});
      //this.setState({freezerInfo:row.freezerInfo});
      //console.log("freezerInfo:",row.freezerInfo);
    }else{
      this.setState({expandRowId: null,alertRecord:[]});
    }
  }

  handleClickOutside(e) {
    if (this.state.expandRowId != null) {
      this.setState({expandRowId: null});
    }
  }

  handleStopClick(e) {
    //console.log("StopClick");
    e.stopPropagation();
  }

  handleOpenModal = (e,type) => {
    //let {type} = data;
    //console.log("template:",template,", selTempMonitor:",selTempMonitor,", isModify:",isModify);
    //console.log("openType:",type);
    this.setState({ modalType: type,showModal: true });

  }

  handleCloseModal = () => {
    this.setState({ showModal: false,alertContent:"",checkData:false,showInput:false,showInputType:"",selReason:{},selResult:{},otherInput:""});
    /*this.setState({});
    this.setState({checkData:false});
    this.setState({showInput:false});
    this.setState({showInputType:""});
    selReason:{},
    selResult:{},*/
  }

  handleMoreButton = () => {
    let nowindex = this.state.showLastIndex+showRowNum;
    if(this.g_abnormalList.length > nowindex){
      //this.setState({abnormalList:this.g_abnormalList.slice(0,nowindex)});
      this.setState({showLastIndex:nowindex});
    }else{
      //this.setState({abnormalList:this.g_abnormalList.slice(0,this.g_abnormalList.length)});
      //this.setState({showLastIndex:this.g_abnormalList.length});
      this.setState({showLastIndex:this.g_abnormalList.length,showMoreButton:false});
    }
  }

  handleItemSelectChanged = (e) => {
    var selection = {};
    //console.log("e:",e);
    //this.setState({checkData:false});
    if(this.state.modalType == "reason"){
        selection = this.dropdownReason.filter(sel => {
        return sel.code.match(e.value);
      });
      //this.setState({ checkData:false,selReason: selection[0] });
      if(selection[0].code == "ZZZZZ"){ //其他
        this.setState({checkData:false,selReason: selection[0],showInput:true,showInputType:"other"});
      }else{
        this.setState({checkData:false,selReason: selection[0],showInput:false,showInputType:""});
      }
    }else{
      selection = this.state.dropdownResult.filter(sel => {
        return sel.code.match(e.value);
      });
      if(selection[0].code == "ZZZZZ"){ //其他
        this.setState({checkData:false,showInput:true,showInputType:"other",selResult: selection[0]});
      }else{
        let condition="", action="";
        if((typeof selection[0].extension!="undefined") &&　selection[0].extension!=null){
          //condition = this.dropdownResultCon.filter(con => {
          //  return con.id == selection[0].extension.abnormal_result_condition_id;
          //});
          action = this.dropdownResultAct.filter(act => {
            return act.id == selection[0].extension.adnormal_action_id;
          });
        }
        switch (action.length>0 ? action[0].code:""){ //判斷動作顯示
          case "1": //通知冰箱暫停使用群組
            this.setState({checkData:false,showInput:true,showInputType:"pause",selResult: selection[0]});
            break;
          case "3": //設定除霜起始時間
            this.setState({checkData:false,showInput:true,showInputType:"defrost",selResult: selection[0]});
            break;
          case "2": //通知裝置故障群組
            this.setState({checkData:false,showInput:false,showInputType:"breakdown",selResult: selection[0]}); //UI 不需改變
            break;
          default:
            this.setState({checkData:false,showInput:false,showInputType:"",selResult: selection[0]});
            break;
        }
      }
      //this.setState({ selResult: selection[0] });
    }

    //console.log("Add selCondition:",selection[0]);
  }

  handleResultTimeChanged=(e,type)=>{
    switch (type) {
      case "pauseTime":
        this.setState({selPausePeriod:e.value});
        //console.log("pauseTime",e.value);
        break;
      case "defrostHr":
        this.setState({selDefrostHr:e.value});
        //console.log("selDefrostHr",e.value);
        this.doMakeDefrostSch(e.value,this.state.selDefrostMin);
        break;
      case "defrostMin":
        this.setState({selDefrostMin:e.value});
        //console.log("selDefrostMin",e.value);
        this.doMakeDefrostSch(this.state.selDefrostHr,e.value);
        break;
    }
  }

  handleOtherValueChanged = (e) =>{
    //console.log("other input:",e.target.value)
    this.setState({otherInput:e.target.value});
  }

  doMakeDefrostSch=(hr,min)=>{
    let duration = this.state.freezerInfo.defrosting_duration;
    let startTime = moment("1989/01/01 "+hr+":"+min+":00", "YYYY/MM/DD HH:mm:ss");
    let sch = "";
    let frequency = (24/this.state.defrostFreq)*60;
    //console.log("startTime:",startTime);
    for(let i=0; i<this.state.defrostFreq; i++){
      sch = sch + moment(startTime).format("HH:mm")+" ~ "+ moment(startTime).add(duration,"minutes").format("HH:mm")+"\n";
      startTime = moment(startTime).add(frequency,"minutes");
    }
    this.setState({defrostSch:sch});
  }

  doGetDefrostTimeArray = () =>{
    let sch = this.state.defrostSch.split("\n");
    //console.log("defrostSch arrary:",sch);
    let timeData = [];
    _.map(sch, s=>{
      if(s!=""){
        let time = s.split(" ~ ");
        //console.log("time:",time);
        timeData.push({from_to:[time[0],time[1]]});
      }
    });
    //console.log("timeData:",timeData);
    return timeData;
  }

  doGetDefineList =(type) => {
    //const {token} = this.props;
    let data = {type: type, token: this.token};
    apiDefineList(data)
    .then(function (response) {
      if(response.data.status =="1"){
        let defines = response.data.defines;
        sortByKey(defines,'code',false,true,false);
        switch (type) {
          case "abnormal_reason":
            this.dropdownReason = defines;
            break;
          case "abnormal_result":
            this.dropdownResult = defines;
            this.setState({dropdownResult:defines});
            break;
          case "abnormal_result_condition":
            this.dropdownResultCon = defines;
            break;
          case "adnormal_action":
            this.dropdownResultAct = defines;
            break;
        }
      }else{
        console.log("doGetDefineList response:",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetDefineList",error);
    });
  }

  doGetFreezerPropList=async  (freezerId)=>{
      let reqData = {freezer_id:freezerId,type:"defrost_time",token:this.token};
      let response = await apiFreezerPropertyList(reqData);
      /*apiFreezerPropertyList(reqData)
      .then(await function (response) {*/
        if(response.data.status == 1){
          let propertys = response.data.propertys;
          if(propertys.length <= 0){ //表示沒除霜功能
            console.log("沒除霜功能");
            let temp = [];
            _.map(this.state.dropdownResult, result=>{
                let condition = this.dropdownResultCon.filter(con => {
                  return con.id == result.extension.abnormal_result_condition_id;
                });
              //console.log("dropdownResultCon",this.dropdownResultCon);
              //console.log("condition",condition);
              if(condition.length>0 && condition[0].code != "2"){
                temp.push(result);
              }
            });
            //console.log("dropdownResult",temp);
            this.setState({dropdownResult:temp,defrostSch:""});
          }else{
            let timeData = propertys[0].data,timeSch = "";
            let startTime = (timeData[0].from_to.length>=0) ? timeData[0].from_to[0].split(":") : ["08","00"]; //起始時間 08:00
            //console.log("defrostFreq:",timeData.length);
            //this.setState({freezerPropId: propertys[0].property_id,defrostFreq:timeData.length});
            for(let i =0; i<timeData.length;i++){
              if(timeData[i].from_to.length>=2){
                /*if(i==0){
                  let startTime = (timeData[i].from_to.length>0) ? timeData[i].from_to[0].split(":") : ["08","00"]; //起始時間 08:00
                  //console.log("startTime:",startTime)
                  this.setState({selDefrostHr:startTime[0],selDefrostMin:startTime[1]});
                }*/
                timeSch += timeData[i].from_to[0]+" ~ "+timeData[i].from_to[1]+"\n";
              }
            }
            this.setState({selDefrostHr:startTime[0],selDefrostMin:startTime[1],freezerPropId: propertys[0].property_id,defrostFreq:timeData.length,defrostSch:timeSch});
          }
        }else{
          console.log("GetFreezerPropList response:",response);
        }

      /*}.bind(this))
      .catch(function (error) {
        console.log("GetFreezerPropList error:",error);
      });*/
  }

  doGetFreezerInfo=async(freezerId)=>{
      let reqData = {freezer_id:freezerId,token:this.token};
      let response = await apiFreezerInfo(reqData);
      if(response.data.status == 1){
        let freezerInfo = response.data.freezer;
        //console.log("doGetFreezerInfo:",freezerInfo );
        //this.setState({freezerInfo:freezerInfo});
        return freezerInfo;
      }else{
        console.log("doGetFreezerInfo response:",response);
      }
  }

  doGetAbnormalList = (branchId, branchName,start,end)=>{
    //console.log("count:",count," totalCount",this.selStoreCount);
    let reqData = {
      branch_id:branchId,
      monitor_item:"temperature",
      period:[start,end],
      token: this.token};
    //console.log("req data:",reqData );
    apiAlertRecordList(reqData)
    .then(async (response) => {
      if(response.data.status == 1){
        //console.log("dicFreezers:", this.dicFreezers);
        //console.log("alert_triggers:",response.data.alert_triggers);
        await Promise.all(_.map(response.data.alert_triggers, async alert=>{
          if(alert.target_type == "freezer"){
            let freezerInfo = this.dicFreezers[alert.target_id];//await this.doGetFreezerInfo(alert.target_id);
            //console.log("freezerInfo:",freezerInfo.department_id,"freezerInfo.status:",freezerInfo.status);
            //console.log("this.props.storeDepartment:",this.props.storeDepartment);
            if(typeof freezerInfo!="undefined" && freezerInfo.status!=4){//有在搜尋部門裡 且 冰箱沒被刪除
              let pos = this.props.storeDepartment.filter(department => {
                return (department.id ==freezerInfo.department_id && department.select);
              });
              //console.log("pos:",pos);
              if(pos.length>0){
                let record = [];//await this.doGetAlertRecord(alert.alert_id);
                //console.log("record:",record);
                let reason=false, result=false;
                if(alert.alert_status==111){//增加第一個原因
                  reason = true;
                } else if(alert.alert_status == 101){//增加第一個結果時，變為fixed
                  reason = true;
                  result = true;
                }
                /*if(record.length > 0){
                  _.map(record,rec => {
                    if(rec.content_type=="cause"){reason = true;}
                    if(rec.content_type=="conclusion"){result = true;}
                  })
                }*/
                this.g_abnormalList.push({id:alert.alert_id,branchName:branchName,freezerId:freezerInfo.freezer_id,
                  freezerName:freezerInfo.name,department:pos[0].name,happenedTime:(alert.event_time?alert.event_time:alert.timestamp),
                  reasons:reason,impResult:result, alertRecord:record,freezerInfo:freezerInfo,freezerStandardDegree:alert.monitor_rule.upper_limit});
              }
            }
          }
        }));
        this.countList=this.countList+1;
        if(this.selStoreCount == this.countList){
          this.g_abnormalList = sortByKey(this.g_abnormalList, "department");
          if(this.g_abnormalList.length > this.state.showLastIndex ){
            //this.setState({abnormalList:this.g_abnormalList.slice(0,this.state.showLastIndex)});
            this.setState({abnormalList:this.g_abnormalList,blocking:false,showMoreButton:true});
          }else{
            //this.setState({abnormalList:this.g_abnormalList});
            this.setState({abnormalList:this.g_abnormalList,blocking:false,showMoreButton:false});
          }
          this.props.setAbnormalList(this.g_abnormalList);
          //this.setState({abnormalList:this.g_abnormalList,blocking:false});
        }
      }else{
        console.log("doGetAbnormalList response:",response);
        this.setState({blocking:false});
      }
    })
    .catch((error) => {
        console.log("doGetAbnormalList error:",error);
        this.setState({blocking:false});
    });
  }

  doGetAlertRecord = async (alertId) => {
    let reqData = {alert_id:alertId,token: this.token}
    let response = await apiAlertRecordInfo(reqData);
    if(response.data.status == 1){
      let respData = response.data.alert_records;
      let record = [];
      for(let i=0; i <respData.length;i++){
        record.push(respData[i].record);
      }
      sortByKey(record,"timestamp",true,false,true);
      return record;
    }else{
      console.log("doGetAlertRecord response:",response);
    }
  }

  handelAddNewItem = (e) =>{
    this.setState({checkData:true});
    let content = "",reqData={};
    //console.log("modalType:",this.state.modalType);
    switch (this.state.modalType) {
      case "reason":
        if(typeof this.state.selReason.code=="undefined"){return;}
        if(this.state.selReason.code == "ZZZZZ"){ //其他
          if(typeof this.state.otherInput=="undefined" || this.state.otherInput==""){return;}
          content = this.state.otherInput;
        }else{
          content = this.state.selReason.name;
        }
        reqData = {
            alert_id:this.state.expandRowId,
            content_type: "cause",
            content: content,
            token: this.token
          };
        this.doAddAlertRecord(reqData);
        break;
      case "result":
        //console.log("freezerInfo:", this.state.freezerInfo);
        if(typeof this.state.selResult.code=="undefined"){return;}
        if(this.state.selResult.code == "ZZZZZ"){ //其他
          if(typeof this.state.otherInput=="undefined" || this.state.otherInput==""){return;}
          content = this.state.otherInput;
        }else{
          let req={};
          let action =(typeof this.state.selResult.extension=="undefind")?[]:this.dropdownResultAct.filter(act => {
            return act.id == this.state.selResult.extension.adnormal_action_id;
          });
          switch (action.length>0 ? action[0].code:""){ //判斷動作顯示
            case "1": //通知冰箱暫停使用群組
              if(typeof this.state.selPausePeriod=="undefined"){return;}
              console.log("通知冰箱暫停使用群組");
              let reasonRec = this.state.alertRecord.find(rec=>{
                return rec.content_type=="cause"});
              req = {freezer_id:this.state.freezerInfo.freezer_id,period:this.state.selPausePeriod,
                      reason:(typeof reasonRec!="undefined")?reasonRec.content:"",
                      token:this.token}
              this.doSetFreezerPause(req);
              break;
            case "3": //設定除霜起始時間
              if(typeof this.state.selDefrostHr=="undefined"){return;}
              if(typeof this.state.selDefrostMin=="undefined"){return;}
              console.log("設定除霜起始時間");
              req = {property_id:this.state.freezerPropId,data:this.doGetDefrostTimeArray(),token:this.token};
              //console.log("defrost reqData:",req);
              this.doSetDefrostTime(req);
              break;
            case "2": //通知裝置故障群組
              console.log("通知裝置故障群組");
              this.doSetSensorDisable(this.state.freezerInfo.sensor_ids[0]);
              break;
          }
          content = this.state.selResult.name;
        }
        reqData = {
            alert_id:this.state.expandRowId,
            content_type: "conclusion",
            content: content,
            token: this.token
          };
        this.doAddAlertRecord(reqData);
        break;
    }
    this.handleCloseModal();
  }

  doAddAlertRecord = (data) =>{
    //console.log("reqData:",data);
    apiAlertRecordAdd(data)
    .then(async function (response) {
      if(response.data.status == 1){
        let record = await this.doGetAlertRecord(data.alert_id);
        this.setState({alertRecord:record});
        let index =this.g_abnormalList.findIndex(function(item, i){
                          return (item.id === data.alert_id)
                        });
        this.g_abnormalList[index].alertRecord = record;
        if(data.content_type=="cause"){this.g_abnormalList[index].reasons = true;}
        if(data.content_type=="conclusion"){this.g_abnormalList[index].impResult = true;}
        //console.log("2.this.g_abnormalList[idx]:",this.g_abnormalList[index])
        if(this.g_abnormalList.length > this.state.showLastIndex ){
          //this.setState({abnormalList:this.g_abnormalList.slice(0,this.state.showLastIndex)});
          this.setState({abnormalList:this.g_abnormalList,showMoreButton:true});
        }else{
          //this.setState({abnormalList:this.g_abnormalList});
          this.setState({abnormalList:this.g_abnormalList,showMoreButton:false});
        }

      }else{
        console.log("doAddAlertRecord response:",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doAddAlertRecord error:",error);
    });
  }

  doSetDefrostTime = (reqData)=>{
    apiFreezerPropertyUpdate(reqData)
    .then(function (response) {
      if(response.data.status == 1){
        console.log("doSetDefrostTime success");
      }else{
        console.log("doSetDefrostTime response",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doSetDefrostTime error",error);
    });
  }

  doSetFreezerPause = (reqData)=>{
    apiFreezerPause(reqData)
    .then(function (response) {
      if(response.data.status == 1){
        console.log("doSetFreezerPause success");
      }else{
        console.log("doSetFreezerPause response",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doSetFreezerPause error",error);
    });
  }

  doSetSensorDisable = (sensorId)=>{
    let reqData = {sensor_id:sensorId,token:this.token};
    apiSensorDisable(reqData)
    .then(function (response) {
      if(response.data.status == 1){
        console.log("doSetSensorDisable success");
      }else{
        console.log("doSetSensorDisable response",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doSetSensorDisable error",error);
    });
  }

  doGetFreezerTempRecord = (freezerId,happenedTime,standardDegree) => {
    var reqdata = {
      type: "freezer",
      targetId: freezerId,
      startTime: moment(happenedTime).subtract(18, 'hour').format("YYYY-MM-DD HH:mm"), //前 3/4 的時間
      endTime: moment(happenedTime).add(6,'hour').format("YYYY-MM-DD HH:mm"),//後 1/4 的時間
      token: this.token
    }
    //console.log(" reqdata, ",  reqdata);
    apiDataRetrieve(reqdata)
    .then(function (response) {
      //console.log("getFreezerDataRetrieve response, ", response.data);
      if(response.data.status==1){
        var freezerData = [];
        if(response.data.sensors.length > 0) {
          let sensorData = response.data.sensors[0].sensor_datas, happenData=null, getHappenTime = false;
          //console.log("getHappenTime:",getHappenTime);
          for(var i=0 ; i<sensorData.length ; i++) {
            happenData=null;
            //console.log("sensorData",  moment(sensorData[i].timestamp*1000).utc().format("YYYY-MM-DD HH:mm"));
            //console.log("happenedTime",moment(happenedTime).format("HH:mm"));
            if(moment(sensorData[i].timestamp*1000).utc().format("HH:mm")==moment(happenedTime).format("HH:mm")){
              happenData = sensorData[i].value.temperature;
              getHappenTime = true;
              //console.log("getHappenTime in:",getHappenTime);
            }
            var beginningTime =moment(sensorData[i].timestamp*1000).utc().format("YYYY-MM-DD HH:mm");
            if(!getHappenTime && Date.parse(moment(happenedTime).format("YYYY-MM-DD HH:mm")) < Date.parse(beginningTime) && happenData==null){
              var preTime =moment(sensorData[i-1].timestamp*1000).utc().format("YYYY-MM-DD HH:mm");
              let interval1 = moment.duration(moment(happenedTime).diff(moment(preTime))).asMinutes();
              let interval2 = moment.duration(moment(beginningTime).diff(moment(happenedTime))).asMinutes();
              if(interval2<interval1){
                happenData = sensorData[i].value.temperature;
              }else{
                freezerData[i-1].happenTemp = freezerData[i-1].temperature;
              }
              getHappenTime = true;
            }
            //console.log("happenData",  happenData);
            freezerData.push({
              time: moment(sensorData[i].timestamp*1000).utc().format("YYYY-MM-DD HH:mm"),
              temperature: sensorData[i].value.temperature,
              happenTemp:happenData,
              standardDegree:standardDegree
            });
          }
        }
        //console.log("freezerData, ", freezerData);
        this.setState({freezerTempRecord: freezerData});
      }else{
        console.log("doGetFreezerTempRecord response:",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetFreezerTempRecord error:",error);
    });
  }

  doSortField = (fieldName,order, isDateTime)=>{
    this.g_abnormalList = sortByKey(this.g_abnormalList, fieldName, isDateTime, false, order != 'asc');
    this.setState({abnormalList:this.g_abnormalList});
  }

  render() {
    const {filterabnoraml, user} = this.props;
    const abnormalList= this.state.abnormalList;

    let checkOperating = false;
    if(user.user_id && user.auth_info.webpage ){
      let operatingAuth = user.auth_info.webpage.find(x=>(x.page_id =="InputExceptionRecord" && x.auth.indexOf("read") > -1) );
      checkOperating = operatingAuth ? true:false;
    }
    let dateTo = moment().add('1','days').format('YYYY/MM/DD');
    dateTo = moment(dateTo).add('-1','seconds').format('YYYY/MM/DD  HH:mm:ss');

    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
      <div className="Subpage" onClick={(e) => this.handleClickOutside(e)}>
         <DateRangePicker
           From = {filterabnoraml.From=="undefined" ? moment().add('-6','days').format('YYYY/MM/DD'):filterabnoraml.From}
           To = {filterabnoraml.To=="undefined" ? dateTo : filterabnoraml.To}
           Type="abnormal"
         />
         <AbnormalStatisitcs abnormalList={this.g_abnormalList} searchfilter={filterabnoraml}/>
         <div style={{margin: "0 0 1% 0", width:"100%", backgroundColor:"#FFF"}}>
            <InfoList abnormalList={abnormalList}
              expandRowId = {this.state.expandRowId}
              onExpand={(e, row) => this.handleExpandRow(e, row)}
              stopClick = {this.handleStopClick}
              onShowModal = {this.handleOpenModal}
              alertRecord = {this.state.alertRecord}
              freezerTempRecord = {this.state.freezerTempRecord}
              checkOperating = {checkOperating}
              doSortField = {this.doSortField}
              showLastIndex = {this.state.showLastIndex}
              defrostSch = {this.state.defrostSch}
            />
            {/*<Button className="moreButton" style={{display:this.state.showMoreButton ? 'block':'none'}} onClick={this.handleMoreButton}>{Locales.common.更多}</Button>*/}
         <ModalAddRecord
           modalType = {this.state.modalType}
           onShowModal={this.handleOpenModal}
           onCloseModal={this.handleCloseModal}
           showModal = {this.state.showModal}
           onAddItemClick = {this.handelAddNewItem}
           onSelectChanged = {this.handleItemSelectChanged}
           onValueChanged ={this.handleOtherValueChanged}
           selReason = {this.state.selReason}
           selResult = {this.state.selResult}
           reasonMenuItems = {this.dropdownReason}
           resultMenuItems = {this.state.dropdownResult}
           showInput = {this.state.showInput}
           showInputType = {this.state.showInputType}
           handleResultTimeChanged = {this.handleResultTimeChanged}
           selPausePeriod = {this.state.selPausePeriod}
           selDefrostHr = {this.state.selDefrostHr}
           selDefrostMin = {this.state.selDefrostMin}
           defrostSch = {this.state.defrostSch}
           checkData = {this.state.checkData}
           otherInput = {this.state.otherInput}
         />
         </div>

      </div>
      </BlockUi>
    );
  }
}

function InfoList(props) {
  //let groupedStores = props.abnormalList.groupBy('store',false); //根據店家做group
  //let store = 0;
  return(
    <div className="abnormalSingle" style={{backgroundColor: "white"}}>
    {renderAbnormalList2(props)}
    </div>
  );
  /*return _.map(groupedStores, gstore => {
      store++;
      if(props.selStoreLen>1){
        return(
          <GroupStoreInfo key={store} abnormalList={gstore} eventKey={store} count={gstore.length}
          result={props.result}
          type={props.type}
          expandRowId = {props.expandRowId}
          onExpand={props.onExpand}
          stopClick = {props.stopClick}
          onShowModal = {props.onShowModal}
          />
        );
      }else{

      }
    });*/
}

function GroupStoreInfo(props){
    return(
      <Panel eventKey={props.eventKey} className="abnormalGrops" style={{backgroundColor: "white", borderRadius:"1px"}}>
            <Panel.Heading>
              <Panel.Title toggle >
              <div>
                <span style={{fontSize: "28px", display: "inline-block", padding: "25px 0 25px 20px"}}>{props.abnormalList[0].store}</span>
                <div style={{float: "right", padding: "12px 30px 0 0"}}>
                  <span style={{fontSize: "48px"}}>{props.count}</span>
                  <span style={{fontSize: "28px", paddingLeft: "10px"}}>{Locales.common.筆}</span>
                </div>
              </div>
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body collapsible>
              {renderAbnormalList2(props.abnormalList, props.result, props.type, props.expandRowId, props.onExpand,true,props.stopClick, props.onShowModal)}
            </Panel.Body>
      </Panel>
    );
}

function renderAbnormalList2(props) {
  //console.log("expandRowId:",expandRowId);
  const {abnormalList, expandRowId, onExpand, lenthanone, stopClick, onShowModal,alertRecord,freezerTempRecord,checkOperating, doSortField, showLastIndex} = props
  const columns = [{
    dataField: 'freezerName',
    text: Locales.abnormal.冷凍櫃,
    headerStyle: { width: '30%' },
    sort: true,
    onSort: (field, order) => {
        doSortField(field,order,false);
      }
  },{
    dataField: 'branchName',
    text: Locales.abnormal.門市,
    headerStyle: { width: '15%' },
    searchable: false,
    sort: true,
    sortFunc: (a, b, order, dataField) => {
      if(order != 'asc') {
        if(a && b) { return ((a > b) ? -1 : ((a < b) ? 1 : 0)); }
        else if (a) { return -1; }
        else { return 1; }
      } else {
        if(a && b) { return ((a > b) ? 1 : ((a < b) ? -1 : 0)); }
        else if (a) { return 1; }
        else { return -1; }
      }
    },
    onSort: (field, order) => {
        doSortField(field,order,false);
      }
  },{
    dataField: 'department',
    text: Locales.abnormal.部門,
    headerStyle: { width: '15%' },
    searchable: false,
    sort: true,
    onSort: (field, order) => {
        doSortField(field,order,false);
      }
  },{
    dataField: 'happenedTime',
    text: Locales.abnormal.發生時間,
    headerStyle: { width: '20%' },
    searchable: false,
    sort: true,
    onSort: (field, order) => {
        doSortField(field,order,true);
      },
    formatter: (cell, row, rowIndex, colIndex) => {
        if (row.happenedTime) {
          return ( <Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.happenedTime}`}</Moment>)
        }
      }
  },{
    dataField: 'reasons',
    text: Locales.abnormal.異常原因,
    headerStyle: { width: '10%' },
    searchable: false,
    sort: true,
    onSort: (field, order) => {
        doSortField(field,order,false);
      },
    formatter: (cell, row, rowIndex, colIndex) => {
        //console.log("row.result:",row.result);
        if (row.reasons) {
          return (
              <span>√</span>
            );
        }
      }
  },{
    dataField: 'impResult',
    text: Locales.abnormal.改善結果,
    headerStyle: { width: '10%' },
    searchable: false,
    sort: true,
    onSort: (field, order) => {
        doSortField(field,order,false);
      },
    formatter: (cell, row, rowIndex, colIndex) => {
        //console.log("row.result:",row.result);
        if (row.impResult) {
          return (
              <span>√</span>
            );
        }
      }
    }
  ];
  let expandRow = {
    renderer: row => (
      <table className="SelectInfo abnormalBody" onClick={stopClick}>
      <tbody>
      <tr id={row.id} onClick={(e) => onExpand(e,row)}>
        <td style={{width: '30%'}}>{row.freezerName}</td>
        <td style={{width: '15%'}}>{row.branchName}</td>
        <td style={{width: '15%'}}>{row.department}</td>
        <td style={{width: '20%'}}><Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.happenedTime}`}</Moment></td>
        <td style={{width: '10%'}}>{row.reasons? '√':''}</td>
        <td style={{width: '10%'}}>{row.impResult ? '√':''}</td>
      </tr>
      <tr>
      <td colSpan="6" style={{textAlign:"left"}}>
        <div  style={{padding:"10px"}}>
          <Tabs defaultActiveKey={1} className="tabStyle" id="abnormalInfo-tab" style={{paddingBottom:"20px"}}>
            <Tab eventKey={1} title={Locales.abnormal.事件處理}>
              <div style={{border:"1px solid #D9D9D9", height:"230px",marginTop:"21px", overflowY:"auto"}}>
                <table style={{width:"100%"}}>
                  <tbody style={{border:'none', fontSize:'18px',boxShadow:'none' }}>
                    <EvenHistory eventLists={alertRecord}/>
                  </tbody>
                </table>
              </div>
              <div style={{height:"30px", marginTop:"19px"}}>
                <Button disabled={!checkOperating} style={{width:"200px",height:"40px",color:"#FFFFFF", backgroundColor:"#0B7D9F", border:"1px solid #0B7D9F", marginRight:"30px"}} onClick={(e,type)=>onShowModal(e,"reason")}>{Locales.abnormal.新增異常原因}</Button>
                <Button disabled={!row.reasons || !checkOperating} style={{width:"200px",height:"40px",color:"#FFFFFF", backgroundColor:"#0B7D9F",border:"1px solid #0B7D9F"}} onClick={(e,type)=>onShowModal(e,"result")}>{Locales.abnormal.新增改善結果}</Button>
              </div>
            </Tab>
            <Tab eventKey={2} title={Locales.abnormal.事件發生後記錄}>
              <DeviceRecords rowData={freezerTempRecord} happenTime = {row.happenedTime}/>
            </Tab>
            <Tab eventKey={3} title={Locales.abnormal.除霜設定}>
              <div style={{border:"1px solid #D9D9D9", height:"230px",marginTop:"21px", overflowY:"auto"}}>
                <label style={{display: "block", marginLeft:"10px",marginTop:"10px"}}>{props.defrostSch=="" ? Locales.abnormal.沒有啟用除霜設定:Locales.abnormal.持續時間}</label>
                <label style={{whiteSpace: "pre-line", marginLeft:"20px"}}>{props.defrostSch}</label>
              </div>
            </Tab>
          </Tabs>
        </div>
      </td>
      </tr>
      </tbody>
      </table>
    ),onlyOneExpanding: true,
    expanded: [expandRowId],
    onExpand: (row, isExpand, rowIndex, e) => {
      //console.log("row.id:",row.id);
      onExpand(e,row);
    }
  };

  const rowClasses = (row, rowIndex, isExpanding) => {
    if(expandRowId == row.id) return 'abnormalBodyExpand';
    else return 'abnormalBody';
  };
  const rowEvents = {
    onClick: (e, row, rowIndex) => {
      e.stopPropagation();
    }
  };
  const hiddenRowKeys=[];
  //console.log("3.this.g_abnormalList:",abnormalList);
  //console.log("first hide:",abnormalList[showLastIndex]);
  for(let i=showLastIndex; i<abnormalList.length;i++){
    hiddenRowKeys.push(abnormalList[i].id);
  }

  const defaultSorted = [{
    dataField: 'department',
    order: 'asc'
  }];
  const { SearchBar } = Search;
  const searchedField = ["freezerName"]
  return (
    <CompSearchedTable
      id="tblAbnormal"
      keyField='id'
      placeholder={Locales.abnormal.請輸入欲查詢冰箱名稱}
      defaultSorted={ defaultSorted }
      data={abnormalList}
      columns={ columns }
      //hiddenRows={ hiddenRowKeys }
      expandRow={ expandRow }
      rowClasses = {rowClasses}
      rowEvents={ rowEvents }
      searchedField = {searchedField}
      showLastIndex = {showLastIndex}
    />
    /*<ToolkitProvider
    keyField='id'
    data={abnormalList}
    columns={ columns }

    search
    >
      {
        props => (
          <div>
            <SearchBar { ...props.searchProps }
            style={ { width: '330px', margin:"20px 30px 10px 0",float:"right" } }
            placeholder={Locales.abnormal.請輸入欲查詢冰箱名稱}/>
          <BootstrapTable
            { ...props.baseProps }
            id="tblAbnormal"
            bordered={ false }
            defaultSorted={ defaultSorted }
            classes={lenthanone ?'abnormalList':'tableList'}
            headerClasses = 'tableHeader'
            expandRow={ expandRow }
            rowClasses = {rowClasses}
            rowEvents={ rowEvents }
            hiddenRows={ hiddenRowKeys }
          />
        </div>
        )
      }
    </ToolkitProvider>*/
  );
}
function renderAbnormalList(abnormalList, type, dateFrom, dateTo) {
  return _.map(abnormalList, abnormal => {
    if ((type.length==3) || ((abnormal.reasons==false ) && (abnormal.impResult==false ) && hasKey(type, 1) ||
        (abnormal.reasons==true ) && hasKey(type, 2) ||
        (abnormal.impResult==true ) && hasKey(type, 3))
  ){
      return (
        <tr key={abnormal.id} style={{height: "50px", borderBottom:'1px solid #F1F1F3'}}>
          <td>{abnormal.freezerName}</td>
          <td>{abnormal.branchName}</td>
          <td>{abnormal.department}</td>
          <td>{abnormal.happenedTime}</td>
          <td>{(abnormal.reasons)?"v":""}</td>
          <td>{(abnormal.impResult)?"v":""}</td>
        </tr>
      );
    }
  });
}
function AbnormalStatisitcs(props){ //連線異常統計圖表
  const {abnormalList,searchfilter} = props;
  //console.log(searchfilter);
  let tempCount=abnormalList.length,powerCount=0;
  /*let itmes = [];
  _.map(abnormalList, abnormal => {
    if ((searchfilter.Filter.length==3) || ((abnormal.reasons==false ) && (abnormal.impResult==false ) && hasKey(searchfilter.Filter, 1) ||
        (abnormal.reasons) && hasKey(searchfilter.Filter, 2) ||
        (abnormal.impResult) && hasKey(searchfilter.Filter, 3))
    ){
      if(searchfilter.FilterType.length==2 ||
        (hasKey(searchfilter.FilterType, 1) && abnormal.type == "temp") ||
        (hasKey(searchfilter.FilterType, 2) && abnormal.type == "device"))
      {
        switch (abnormal.type) {
          case "temp":
            tempCount++;
            break;
          case "device":
              powerCount++;
              break;
        }
          itmes.push(abnormal);
      }
    }
  })*/
  //console.log(itmes);

  const data = {
  labels:[Locales.abnormal.溫度異常],
	datasets: [{
		data: [abnormalList.length],
		backgroundColor: [
		'#FF6565'
		],
		hoverBackgroundColor: [
      '#FF6565'
		]
	}]
};

const legendOpts = {
  display: false,
  position: 'left',
  reverse: false
};

const option = {
  animation: false,
  maintainAspectRatio: false,
  marginTop:"-20px"
};

return (
  <div className="row bkstatistc">
  <div className="col-xl-1 col-lg-2 col-md-2 col-sm-1 col-1" style={{marginTop:"2%"}}>
    <table style={{width:"100%"}}>
      <tbody>
        <tr style={{height:"24px",lineHeight:"2"}}>
          <td colSpan="2" style={{fontSize:"18px", textAlign:"left", color:"#849FB4"}}>{Locales.abnormal.異常紀錄}</td>
        </tr>
        <tr>
          <td style={{fontSize:"3vw", textAlign:"center", width:"80%"}}>{tempCount}</td>
          <td style={{fontSize:"14px", textAlign:"left",paddingTop:"20px"}}>{Locales.common.筆}</td>
        </tr>
        <tr>
          <td colSpan="2">
          <table style={{fontSize:"15px",width:"100%"}}>
          <tbody>
          <tr style={{height:"35px"}}>
            <td style={{width:"15px"}}><label style={{backgroundColor:"#FF6565", width:"6.31", height:"22px",width:"6.31px",marginTop: "8px"}}/></td>
            <td style={{fontSize:"18px", textAlign:"left"}}>{Locales.abnormal.溫度異常}</td>
          </tr>
          </tbody>
          </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6" style={{marginTop:"2%", marginBottom:"1%"}}>
    <Doughnut data={data} width={250} height={250} legend={legendOpts} options={option} redraw/>
  </div>
  <div className="col-xl-8 col-lg-7 col-md-12 col-sm-12 col-12" style={{marginTop:"2%"}}>
    <StackedBarChart abnormalList={abnormalList} searchfilter={searchfilter}/>
  </div>
</div>
    );
  //this.setState({total:itmes.length});
  //this.setState({abnormalTypeCount:[tempCount,powerCount,connectionCount]});
}
function StackedBarChart(props){ // stackBar 圖
    const {abnormalList, searchfilter} = props;
    let startTime = moment(searchfilter.From).format("YYYY/MM/DD"), endTime = moment(searchfilter.To).format("YYYY/MM/DD");
    let max= 0,labels=[],temperature = [];
    //sortByKey(abnormalList,'happenedTime',true,false,false);
    let grouped = abnormalList.groupBy('happenedTime',true);
    //console.log("After Group by:",abnormalList);
    for (let d = new Date(startTime); d <= new Date(endTime); d.setDate(d.getDate() + 1)) {
      let date = moment(d);//.format("YYYY/MM/DD");
      labels.push(date);
      /*if(date==startTime){
        labels.push(date.substr(5,5));
      }else{
        labels.push(date.substr(8,2));
      }*/
      //labels.push(date);
      date = moment(d).format("YYYY/MM/DD");
      if(date in grouped){
        let tempCount =grouped[date].length;
        temperature.push(tempCount);
        if(tempCount > max){max = tempCount;}
      }else{
        temperature.push(0);
      }
    }
    //console.log("label:",labels)
    let step = Math.round(max/5);
    const data = {
    labels: labels,
    datasets: [
      {
        label: Locales.abnormal.溫度異常,
        backgroundColor: '#FF6565',
        borderColor: '#FF6565',
        borderWidth: 1,
        stack: '1',
        hoverBackgroundColor: 'rgba(255, 101, 101, 0.7)',
        hoverBorderColor: '#FF6565',
        data: temperature
      }
    ]
  };
  let diffDays = moment(labels[labels.length-1]).diff(labels[0],'days')+1;
  let dayeRange = Math.round(diffDays/7);
  //console.log("diffDays:",diffDays);
  //console.log("dayeRange:",dayeRange);
  let shownLabels = [];//[moment(labels[labels.length-1]).format("MM/DD")];
  if(dayeRange>0){
    for(let d = new Date(moment(labels[0]).format("YYYY/MM/DD")); d <= new Date(moment(labels[labels.length-1]).format("YYYY/MM/DD")); d.setDate(d.getDate() + dayeRange)){
      //console.log("d:",moment(d).format("MM/DD"));
      shownLabels.push(moment(d).format("MM/DD"));
    }
  }else{
    for( let i=0; i<labels.length;i++ ){
      shownLabels.push(moment(labels[i]).format("MM/DD"));
    }
  }

  var options = {
    animation: false,
    legend: { display: false },
    tooltips: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: function(tooltipItem, data) {
          //console.log("data",data);
          //console.log("tooltipItem",tooltipItem);
          return moment(data.labels[tooltipItem[0].index]).format("MM/DD");
        },
        label:function(tooltipItem, data) {
          //console.log("data",data)
          return data.datasets[tooltipItem.datasetIndex].label+':'+tooltipItem.yLabel;
        },
      },
    },
    scales: {
			xAxes: [{
        type: 'category',
        distribution: 'series',
				gridLines: {
					display: false,
          stacked: true
				},
        ticks: {
                autoSkip:false,
                fontSize: 15,
                maxRotation:0,
                callback: (value, index, values) =>{
                  if(shownLabels.indexOf(moment(value).format("MM/DD") )>=0){
                    //console.log(moment(value).format("MM/DD"));
                    return moment(value).format("MM/DD");
                  }else{
                    return "";
                  }

                }
            }
			}],
			yAxes: [{
				display: true,
        stacked: true,
				gridLines: {
					display: true,
				},
        ticks: {
          beginAtZero: true,
          stepSize: max==0 ? 1:Math.ceil(max/5),
          max: max==0 ? 0:Math.ceil(max/5)*5,
          min: 0,
          fontSize: 15,
          // Include a dollar sign in the ticks
          callback: function(value, index, values) {
            if(value==0){return Locales.common.筆;}
            else{return value;}
          }
        }
			}]
		},
  }
  return (
    <Bar
    data={data}
    options={options}
    height={100}
    />
  );
}

function DeviceRecords(props) { //事件發生前後紀錄
  let row = props.rowData;
  let labels = [], datas = [], data2=[], max=-100, min = 100, standardData=[];
  let happenedTime = props.happenTime;
  let startTime= moment(happenedTime).subtract(18, 'hour').format("YYYY/MM/DD HH:mm"); //前 3/4 的時間
  let endTime= moment(happenedTime).add(6,'hour').format("YYYY/MM/DD HH:mm");//後 1/4 的時間
  let  minutes = new Date(startTime).getMinutes();
  startTime= moment(startTime).subtract(minutes, 'minutes').format("YYYY/MM/DD HH:mm");
  let options = {};
  //console.log("startTime",startTime);
  if(row.length==0){
    //console.log("startDay:",startDay);
    for (let d = new Date(startTime); d <= new Date(endTime); d.setMinutes(d.getMinutes() + 10)) {
      let date = moment(d).format("YYYY/MM/DD HH:mm");
      let day = d.getDate();
      //console.log("day:",day);
      let time="";
      time = moment(d);
      labels.push(time);
    }

  }else{ //有溫度紀錄

    let d = new Date(startTime);
    labels.push(moment(d));
    datas.push(null);
    data2.push(null);
    standardData.push(row[0].standardDegree);
    for(var i=0 ; i<row.length ; i++) {
      if(i+1 < row.length){
        let intervals = moment.duration(moment(row[i+1].time).diff(moment(row[i].time))).asMinutes();
        //console.log("intervals",intervals);
        if(intervals>30){
          //console.log("intervals",intervals);
          //console.log("start:",row[i].time,"end:",row[i+1].time);
          labels.push(moment(row[i].time));
          datas.push(row[i].temperature);
          data2.push(row[i].happenTemp);
          standardData.push(row[i].standardDegree);
          for (let d = new Date(row[i].time); d <= new Date(row[i+1].time); d.setMinutes(d.getMinutes() + 10)) {
            let date = moment(d).format("YYYY/MM/DD HH:mm");
            let day = d.getDate();
            //console.log("day:",day);
            let time="";
            time = moment(d);
            labels.push(time);
            datas.push(null);
            data2.push(null);
            standardData.push(row[i].standardDegree);
          }
        }else{
          labels.push(moment(row[i].time));
          datas.push(row[i].temperature);
          data2.push(row[i].happenTemp);
          standardData.push(row[i].standardDegree);
        }
      }else{
        labels.push(moment(row[i].time));
        datas.push(row[i].temperature);
        data2.push(row[i].happenTemp);
        standardData.push(row[i].standardDegree);
      }

      //if(row[i].temperature > max){max=row[i].temperature;}
      //if(row[i].temperature < min){min=row[i].temperature;}
    }
    d = new Date(endTime);
    labels.push(moment(d));
    datas.push(null);
    data2.push(null);
    standardData.push(row[0].standardDegree);
  }

  var data = {
    labels: labels,
    datasets: [{
      label: Locales.abnormal.事件發生時的溫度,
      fill: false,
      backgroundColor: '#0b7d9f',
      borderColor: '#0b7d9f',
      radius: 5,
      pointBackgroundColor: '#0b7d9f',
      hoverBackgroundColor: '#0b7d9f',
      hoverBorderColor: '#0b7d9f',
      data: data2
    },{
      label: Locales.abnormal.溫度,
      fill: false,
      backgroundColor: 'rgba(1,1,1,0)',
      borderColor: 'rgba(255,99,132,1)',
      borderWidth: 1,
      strokeColor:'#0b7d9f',
      pointBackgroundColor: 'rgba(255,99,132,1)',
      hoverBackgroundColor: 'rgba(255,99,132,0.4)',
      hoverBorderColor: 'rgba(255,99,132,1)',
      data: datas
    },{
      label: Locales.abnormal.標準溫度,
      fill: false,
      backgroundColor: '#00ADBD',
      borderColor: '#00ADBD',
      borderWidth: 0,
      strokeColor:'#00ADBD',
      pointRadius:0,
      hoverBackgroundColor: '#00ADBD',
      hoverBorderColor: '#00ADBD',
      data:standardData,
      spanGaps: true,
    }]
  };


  /*if(row.length==0){

  }else{*/
    options = {
      elements: {
          line: {
              tension: 0  // no curve
          }
      },
      tooltips: {
				mode: 'index',
				intersect: false,
        callbacks: {
          title: function(tooltipItem, data) {
            return moment(tooltipItem[0].xLabel).format("MM/DD   HH:mm");
          },
          label:function(tooltipItem, data) {
            //console.log("data",data)
            return data.datasets[tooltipItem.datasetIndex].label+':'+tooltipItem.yLabel+  '°C';
          },
        },
			},
      legend: { display: false },
      scales: {
  			xAxes: [{
          type: 'time',
          bounds:'data', //頭尾不一定顯示label
          time: {
           unit: 'hour',
           unitStepSize: 2,
           displayFormats: {
             'millisecond': 'MMM DD',
             'second': 'MMM DD',
             'minute': 'MMM DD',
             'hour': 'HH:mm',
             'day': 'MM/DD',
             'week': 'MM/DD',
             'month': 'MM/DD',
             'quarter': 'MMM DD',
             'year': 'MMM DD',
           }
         },
          ticks: {
            maxRotation:0,
            source:'auto',// 使用label 取理想間距
          },
  				gridLines: { display: false },
  			}],
  			yAxes: [{
          ticks: {
            fontSize: 15,
            callback: function(value, index) {
              //console.log("index:",index);
                return value + '°C';
            }
          }
  			}]
  		},
    }
  //}
  return (
    <div style={{paddingTop: "40px", paddingBottom: "40px"}}>
        <Line
        data={data}
        options={options}
        height={50}
        />
    </div>
  );
}

function EvenHistory(props){
  let eventLists = props.eventLists;
  //console.log("eventLists:",eventLists);
  return _.map(eventLists, event => {
    let type = "["+(event.content_type=="cause" ? Locales.abnormal.原因:Locales.abnormal.改善結果)+"]";
    return (
      <tr key={event.timestamp} style={{height:"36px", fontSize:"18px", color:"#3D3D3B"}}>
        <td style={{width:"15%",textAlign:"right",height:"36px",border:'none'}}>{event.timestamp}</td>
        <td style={{width:"7%",textAlign:"center",height:"36px",border:'none'}}>{event.user.user_info.name}</td>
        <td style={{textAlign:"left",height:"36px",border:'none'}}>{type+event.content}</td>
      </tr>
    );
  });
}
function ModalAddRecord(props) {
  const timeOptions = [
    {value: "60", label: "1"+Locales.common.小時},
    {value: "120", label: "2"+Locales.common.小時},
    {value: "240", label: "4"+Locales.common.小時},
    {value: "480", label: "8"+Locales.common.小時},
    {value: "720", label: "12"+Locales.common.小時},
    {value: "1440", label: "1"+Locales.common.天},
    {value: "2880", label: "2"+Locales.common.天},
    {value: "0", label: Locales.common.直到手動恢復}
  ];

  var timeHourOptions = [], timeMinOptions = [];
  for(var i=0 ; i<24 ; ++i) {
    timeHourOptions.push({value: i, label: padLeft(i.toString(),2)})
  }
  for(var i=0 ; i<60 ; ++i) {
    timeMinOptions.push({value: i, label: padLeft(i.toString(),2)})
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
      width:"80%",
      height:"400px"
    }
  };
  /*未填資訊 紅框警示*/
  //console.log("selPausePeriod",typeof props.selPausePeriod);
  let chReason = "",chOtherInput = "", chResult="", chPausePeriod="",chDefrostHr="",chDefrostMin="";
  if(props.checkData){
    if(typeof props.selReason.name=="undefined" || props.selReason.name==""){chReason="error";}
    if(props.showInput && props.otherInput==""){chOtherInput="error";}
    if(typeof props.selResult.name=="undefined" || props.selResult.name==""){chResult="error";}
    if(typeof props.selPausePeriod=="undefined" || props.selPausePeriod==""){chPausePeriod="error";}
    if(typeof props.selDefrostHr=="undefined" || props.selDefrostHr==""){chDefrostHr="error";}
    if(typeof props.selDefrostMin=="undefined" || props.selDefrostMin==""){chDefrostMin="error";}
  }

    if(props.modalType == "reason"){
      return(
        <div onClick={e=>e.stopPropagation()}>
          <ReactModal
             isOpen={props.showModal}
             contentLabel="Add Watched Item"
             style={modalStyles}
             onRequestClose={props.onCloseModal}
             shouldCloseOnOverlayClick={true}
          >
          <div style={{fontSize: "20px", fontWeight: "bold"}}>{Locales.abnormal.新增異常原因}</div>
          <div style={{marginTop: "15px",marginBottom: "15px"}}>
            <label className="required">*</label><label>{Locales.abnormal.異常原因}</label>
            <DropdownButton className={chReason} Title={props.selReason.name} Id="1" MenuItems={props.reasonMenuItems} onSelectChanged={props.onSelectChanged} type="reason"/>
            <input style={{marginTop:"10px",height:"100px", display:(props.showInputType=="other" && props.showInput) ? "block":"none"}} type="text" className={"InputStyle "+chOtherInput} placeholder={Locales.abnormal.請在此輸入描述} onChange={e=>props.onValueChanged(e,"result")} required></input>
          </div>
          <div style={{position: "absolute",bottom: 10, left:0}}>
            <Button onClick={props.onCloseModal} style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>{Locales.common.取消}</Button>
            <Button onClick={props.onAddItemClick} style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>{Locales.common.確認}</Button>
          </div>
          </ReactModal>
        </div>
    );
  }else{//新增改善結果
      return(
        <div onClick={e=>e.stopPropagation()}>
          <ReactModal
             isOpen={props.showModal}
             contentLabel="Add Watched Item"
             style={modalStyles}
             onRequestClose={props.onCloseModal}
             shouldCloseOnOverlayClick={true}
          >
          <div style={{fontSize: "20px", fontWeight: "bold"}}>{Locales.abnormal.新增改善結果}</div>
          <div className="row" style={{marginTop: "15px",marginBottom: "15px"}}>
            <div className="col-lg-4 col-md-4 col-sm-4">
              <label className="required">*</label><label>{Locales.abnormal.改善結果}</label>
              <DropdownButton className={chResult} maxMenuHeight={180} Title={props.selResult.name} Id="1" MenuItems={props.resultMenuItems} onSelectChanged={props.onSelectChanged} type="result"/>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4" style={{display:(props.showInputType=="pause" && props.showInput) ? "block":"none"}}>
              <label className="required">*</label><label>{Locales.abnormal.暫停持續時間}</label>
              <Select className={chPausePeriod} maxMenuHeight={180} options={timeOptions} placeholder={Locales.common.請選擇} value={timeOptions.filter(option => option.value == props.selPausePeriod)} onChange={e => props.handleResultTimeChanged(e,"pauseTime")}/>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-3" style={{display:(props.showInputType=="defrost" && props.showInput)? "block":"none"}}>
              <div style={{display: "block"}}>
                <label className="required">*</label><label>{Locales.abnormal.開始時間}</label>
              </div>
              <div style={{width: "45%", display: "inline-block"}}>
                <Select
                  className={chDefrostHr}
                  maxMenuHeight={180}
                  options={timeHourOptions}
                  placeholder={""}
                  onChange={e => props.handleResultTimeChanged(e,"defrostHr")}
                  value={timeHourOptions.filter(option => option.value == props.selDefrostHr)}
                />
              </div>
              <span> : </span>
              <div style={{width: "45%", display: "inline-block"}}>
                <Select
                  className={chDefrostMin}
                  options={timeMinOptions}
                  placeholder={""}
                  onChange={e => props.handleResultTimeChanged(e,"defrostMin")}
                  value={timeMinOptions.filter(option => option.value == props.selDefrostMin)}
                />
              </div>
            </div>
            <div className="col-lg-5 col-md-5 col-sm-5" style={{display:(props.showInputType=="defrost" && props.showInput)? "block":"none"}}>
              <label style={{display: "block"}}>{Locales.abnormal.持續時間}</label>
              <label style={{whiteSpace: "pre-line"}}>{props.defrostSch}</label>
            </div>

          </div>
          <input style={{marginTop:"10px",height:"100px", display:(props.showInputType=="other" && props.showInput) ? "block":"none"}} type="text" className={"InputStyle "+chOtherInput} placeholder={Locales.abnormal.請在此輸入描述} onChange={e=>props.onValueChanged(e,"result")} required></input>
          <div style={{position: "absolute",bottom: 10, left:0}}>
            <Button onClick={props.onCloseModal} style={{width: "185px", height: "50px", marginLeft: "20px", color: "#077598", borderColor: "#077598", backgroundColor: "white"}}>{Locales.common.取消}</Button>
            <Button onClick={props.onAddItemClick} style={{width: "185px", height: "50px", marginLeft: "10px", color: "white", borderColor: "white", backgroundColor: "#077598"}}>{Locales.common.確認}</Button>
          </div>
          </ReactModal>
        </div>
    );
  }
}
function DropdownButton(props) {
  let options=[];
  for(let i=0; i<props.MenuItems.length;i++){
    options.push({value:props.MenuItems[i].code,label:props.MenuItems[i].name});
  }
  return (
    <Select className={props.className} maxMenuHeight={180} options={options} placeholder={Locales.common.請選擇} value={options.filter(option => option.label === props.Title)} onChange={e => props.onSelectChanged(e,props.type)}/>
  );
}
function AddEventList(){
  return(
    <Form horizontal style={{width:"98%", fontSize:"15px",color:"#3D3D3B"}}>
      <FormGroup controlId="formCtrlResonsSelection"　style={{marginBottom:"10px"}}>
        <Col sm={1}> <ControlLabel style={{color:"#3D3D3B",fontSize:"18px",fontWeight:"normal", paddingLeft:"10px"}}>{Locales.abnormal.原因}：</ControlLabel></Col>
        <Col sm={2}>
          <FormControl componentClass="select" placeholder="select">
            <option value="select">{Locales.abnormal.冰箱門開過久}</option>
            <option value="other">...</option>
          </FormControl>
        </Col>
        <Col sm={9}>
          <FieldGroup
            id="formCtrlReasonDesc"
            type="text"
            label=""
            placeholder={Locales.abnormal.描述}
          />
        </Col>
      </FormGroup>
      <FormGroup controlId="formCtrlResultSelection" style={{marginBottom:"10px"}}>
        <Col sm={1}>
          <ControlLabel style={{color:"#3D3D3B",fontSize:"18px",fontWeight:"normal", paddingLeft:"10px"}}>{Locales.abnormal.結果}：</ControlLabel>
        </Col>
        <Col sm={2}>
          <FormControl componentClass="select" placeholder="select">
            <option value="select">{Locales.common.其他}</option>
            <option value="other">...</option>
          </FormControl>
        </Col>
        <Col sm={9}>
          <FieldGroup
            id="formCtrlResultDesc"
            type="text"
            label=""
            placeholder={Locales.abnormal.描述}
          />
        </Col>
      </FormGroup>
      <FormGroup>
        <Col smOffset={1} sm={2}>
          <Button type="submit" style={{color:"#FFFFFF",backgroundColor:"#3B86FF", width:"100%",fontSize:"18px"}}>{Locales.common.送出}</Button>
        </Col>
      </FormGroup>
    </Form>
  );
}
function FieldGroup({ id, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}
function mapStateToProps({filterabnoraml , storeDepartment, store, token,user,abnormallist}, ownProps) {
  return { filterabnoraml, storeDepartment, store, token,user,abnormallist};
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {setAbnormalList,setAbnormalFilter})(AbnormalSubpage);
