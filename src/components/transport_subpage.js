import React, { Component } from "react";
import moment from 'moment';
import { connect } from "react-redux";
import { setUser,setTransportList,setTransportFilter } from "../actions";
import { Tab, Tabs, Button,Form, FormGroup, FormControl, ControlLabel,Col, DropdownButton, MenuItem} from "react-bootstrap";
import BootstrapTable from 'react-bootstrap-table-next';
import { apiDefineList,apiDataRetrieve,apiDataTransaction,toCancelApi } from "../utils/api";
import {hasKey, sortByKey, compareArray, pageStore} from "../utils/common";
import { Redirect } from "react-router-dom";
import {Line,Doughnut, Bar} from "react-chartjs-2";
import "chartjs-plugin-annotation";
import ReactModal from 'react-modal';
import Moment  from '../components/moment_custom'
import DateRangePicker from "../components/comp_DateRangeFilter";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import {Locales} from '../lang/language';
import BlockUi from 'react-block-ui';
import {CompSearchedTable} from "../components/comp_Table";

class TransportSubpage extends Component {
  constructor(props) {
    super(props);
    this.dropdownItems = [{value:1,label:Locales.common.合格},{value:2,label:Locales.common.不合格}];
    //this.g_dropdownOther = [];
    //this.g_allOtherId = [];
    //console.log("this.props.transportlist:",this.props.transportlist)
    this.g_transportList = this.props.transportlist;
    this.g_recDateGroup=[];
    this.g_recTime = [];
    this.g_recValue = [];
    this.g_recValue2 = [];
    this.showRowNum = 20;
    this.selStoreCount = 0;
    this.countList=0;
    //this.startDate = this.props.filtertransport.From;
    //this.endDate = this.props.filtertransport.To;
    this.state={
      total:0,
      expandRowId:null,
      modalImg:"",
      showMoreButton:(this.g_transportList.length > this.showRowNum )?true:false,
      showLastIndex:this.showRowNum,
      transportList:(this.g_transportList.length > this.showRowNum )?this.g_transportList.slice(0,20):this.g_transportList ,
      sensorRecord:[],
      recDateIdx:0,
      blocking:false
    };
    this.handleMoreButton = this.handleMoreButton.bind(this);
    this.handleRecDateChanged= this.handleRecDateChanged.bind(this);
  }
  componentWillUnmount(){
    toCancelApi();
  }

  componentWillReceiveProps(nextProps) {
    //console.log("store:",this.props.store);
    //console.log("componentWillReceiveProps:",nextProps);
    //console.log("nextProps",nextProps);
    //console.log("thisProps",this.props);
    let isChanged = false;
    this.token = nextProps.token

    const {filtertransport, store, transportlist} = nextProps;
    //console.log("doSearch",filtertransport.doSearch);
    if(filtertransport.doSearch ||
      (this.props.filtertransport.From != filtertransport.From ||
        this.props.filtertransport.To != filtertransport.To ||
        !Object.compare(this.props.filtertransport.Filter,filtertransport.Filter))
      ){
      isChanged = true;
      this.props.setTransportFilter({From:filtertransport.From,To:filtertransport.To, Filter:filtertransport.Filter, FilterType:filtertransport.FilterType,doSearch:false});
    }
    let startTime = (filtertransport.From!="undefined")? filtertransport.From : moment().add('-6','days').format('YYYY-MM-DD HH:mm:ss');
    let endTime = (filtertransport.To!="undefined")? filtertransport.To : moment().format('YYYY-MM-DD HH:mm:ss');
    //console.log("start:",startTime," end:",endTime);
    //console.log("searchfilter.From:",searchfilter.From," searchfilter.To:",searchfilter.To);
    if(typeof store === "object" && (store instanceof Array)){
      let selstores = store.filter(s => s.select == true);
      this.selStoreCount = selstores.length;
      //let preselstores = this.props.store.filter(s => s.select == true);
      if(!Object.compare(selstores,pageStore.transport.selStores)){
        pageStore.transport.selStores = selstores;
        isChanged = true;
        //console.log("selected store changed");
      }
      //this.g_transportList = transportlist;
      if(isChanged){
        this.setState({blocking: true});
        //console.log("requery");
        this.g_transportList = [];
        this.countList=0;
        if(selstores.length == 0){
          this.setState({transportList:this.g_transportList,blocking:false,showMoreButton:false});
          this.props.setTransportList(this.g_transportList);
        }
        _.map(selstores, item =>{
          this.doGetTransportList(item.branch_id,item.branch_name,startTime, endTime, filtertransport);
        });
        //
      }
    }

    //this.doGetVendorList(); //fill dropdownOther
    //this.doGetTransportList("rrn5eh8u","test",startTime, endTime, searchfilter);
  }

  handleExpandRow(e, row) {
    //console.log("openDetailTempID, ", row);
    if(row.id != this.state.expandRowId) {
      this.g_recDateGroup=[];
      this.g_recTime = [];
      this.g_recValue = [];
      this.g_recValue2 = [];
      this.setState({sensorRecord:[],expandRowId: row.id});
      this.doGetTransportItem(row);
    }else{
      this.setState({expandRowId: null});
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

  handleMoreButton(){
    let nowindex = this.state.showLastIndex+this.showRowNum;
    if(this.g_transportList.length > nowindex){
      //this.setState({transportList:this.g_transportList.slice(0,nowindex)});
      this.setState({showLastIndex:nowindex});
    }else{
      //this.setState({transportList:this.g_transportList.slice(0,this.g_transportList.length)});
      //this.setState({showLastIndex:this.g_transportList.length});
      this.setState({showMoreButton:false, showLastIndex:this.g_transportList.length});
    }
  }

  handleRecDateChanged(mode){
    if(mode=="add"){
      //console.log("add");
      let idx = this.state.recDateIdx+1;
      //console.log("idx:",idx);
      if(this.g_recDateGroup.length > idx){
        //console.log("idx changed");
        this.setState({recDateIdx:idx});
      }
    }else{
      //console.log("substract");
      let idx = this.state.recDateIdx-1;
      //console.log("idx:",idx);
      if(idx>=0){
        //console.log("idx changed");
        this.setState({recDateIdx:idx});
      }
    }
  }

  doGetTransportList(branchId, branchName,startTime, endTime,searchfilter){
    //console.log("count:",count," totalCount",this.selStoreCount);
    let data = {type:"transport",targetId:branchId,startTime:startTime,endTime:endTime,token:this.token}
    //console.log("searchdata:",data);
    apiDataRetrieve(data)
    .then(async (response)=> {
      if(response.data.status == 1){
        let resData = response.data.transaction_datas;

        for(let i=0; i<resData.length; i++){
          //console.log("branchId:",branchId," resData:",resData);
            let content = resData[i].content;
            if ((searchfilter.Filter.length==2) || //全選
                (content.result) && hasKey(searchfilter.Filter, 1) || //合格
                (!content.result) && hasKey(searchfilter.Filter, 2) //不合格
              ){
                this.g_transportList.push(
                    {id:resData[i].id+"_"+branchId, vendorNo:content.vendor.code, vendorName:content.vendor.name, departure:content.departure_branch.name,
                    dispartureTime:content.departure_time ,arrivingTime:content.arrival_time, terminal:content.arrival_branch.name, updateTime:resData[i].timestamp,
                    result:content.result});
              }
        }

        this.countList=this.countList+1;
        if(this.selStoreCount == this.countList){
          this.g_transportList = sortByKey(this.g_transportList, "updateTime",true,false,true);
          if(this.g_transportList.length > this.state.showLastIndex ){
            //this.setState({transportList:this.g_transportList.slice(0,this.state.showLastIndex)});
            this.setState({showMoreButton:true,transportList:this.g_transportList,blocking:false});
          }else{
            //this.setState({transportList:this.g_transportList});
            this.setState({showMoreButton:false,transportList:this.g_transportList,blocking:false});
          }
          this.props.setTransportList(this.g_transportList);
          //this.setState({transportList:this.g_transportList,blocking:false});
        }
      }else{
        //console.log("get transportList error:",response.data);
        if(this.selStoreCount == this.countList){
          this.setState({blocking:false});
        }
      }

    })
    .catch((error)=> {
      console.log("doGettransportList error:",error);
      this.setState({blocking:false});
    });
  }

  doGetVendorList(){
    apiDefineList({type:"vendor",token:this.token})
    .then(function (response) {
      //console.log("vendor data",response );
      if(response.data.status==1){
        let data = response.data.defines;
        //console.log("vendor data",data );
        sortByKey(data,'name',false,true);
        for(let i =0; i<data.length;i++){
          //console.log("freezers:",freezers[i]);
          this.g_dropdownOther.push({value:data[i].code,label:data[i].name});
          this.g_allOtherId.push(data[i].code);
        }
        //this.setState({dropdownOther:this.g_dropdownOther})
        //this.setState({allOtherId:this.g_allOtherId})
      }else{
        console.log("get vendor List response error:",response.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("get vendor List error:",error);
    });
  }

  doGetTransportItem(row){
    let id = row.id.split("_");
    apiDataTransaction({transactionId:id[0],token:this.token})
    .then(function (resData){
      if(resData.data.status==1){
        let sensors = resData.data.content.sensors;
        //console.log("sensors", sensors);
        let dispartureTime = moment(row.dispartureTime).format("YYYY/MM/DD HH:mm"),
        arrivingTime = moment(row.arrivingTime).format("YYYY/MM/DD HH:mm");
        let sensorRecord = [];
        if(sensors.length>0){
          let sensorId = sensors[0].id;
          let data = sensors[0].sensor_datas;

          /*******測試假資料****/
          /*let startTime =  moment(row.dispartureTime).add(-120,'minutes').format("YYYY/MM/DD  HH:mm:ss");
          let endTime = moment(row.arrivingTime).add(80,'minutes').format("YYYY/MM/DD HH:mm:ss");

          for (let d = new Date(startTime); d <= new Date(endTime); d.setMinutes(d.getMinutes() + 10)) {
            var num = Math.floor(Math.random()*20) + 1; // this will get a number between 1 and 99;
            num *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
            sensorRecord.push({time:moment(d).format("YYYY/MM/DD HH:mm:ss"), value:num });
          }*/
          /*正式版*/
          for(let i=0; i<data.length;i++){
            //console.log(moment.unix(data[i].timestamp/1000).utc().format("YYYY/MM/DD HH:mm:ss"));
            if(data[i].timestamp.length  == 13){
              sensorRecord.push({time:moment.unix(data[i].timestamp/1000).utc().format("YYYY/MM/DD HH:mm:ss"), value:data[i].value.temperature});
            }else{
                sensorRecord.push({time:moment.unix(data[i].timestamp).utc().format("YYYY/MM/DD HH:mm:ss"), value:data[i].value.temperature});
            }
          }
          sortByKey(sensorRecord,'time',true,false,false);
          //console.log("sensorRecord:",sensorRecord);
          let recordStartTime =  new Date(moment(sensorRecord[0].time).add('-20','minutes').format('YYYY/MM/DD  HH:mm:ss'));
          for (let d = new Date(dispartureTime); d <= new Date(arrivingTime); d.setMinutes(d.getMinutes() + 20)) {
            if(d < recordStartTime){
                sensorRecord.push({time:moment(d).format("YYYY/MM/DD HH:mm:ss"), value:null});
            }else{break;}
          }

        }else{
          for (let d = new Date(dispartureTime); d <= new Date(arrivingTime); d.setMinutes(d.getMinutes() + 20)) {
            sensorRecord.push({time:moment(d).format("YYYY/MM/DD HH:mm:ss"), value:null});
          }
        }
        sortByKey(sensorRecord,'time',true,false,false);
        let groupedSensorRecord = sensorRecord.groupBy('time',true);
        //console.log("groupedSensorRecord:",groupedSensorRecord);
          let grouptime=[],time =[], value=[], value2=[], getDeparture=false, getArrival=false;
              //console.log("dispartureTime:",dispartureTime," arrivingTime:",arrivingTime);
          Object.keys(groupedSensorRecord).forEach(function(t){
              if(Date.parse(moment(t).format("YYYY/MM/DD")) >= Date.parse(moment(row.dispartureTime).format("YYYY/MM/DD")) && Date.parse(moment(t).format("YYYY/MM/DD")) <= Date.parse(moment(row.arrivingTime).format("YYYY/MM/DD"))){
                grouptime.push(t);
                time[t] = new Array();
                value[t] = new Array();
                value2[t] = new Array();
                for(let i=0; i< groupedSensorRecord[t].length; i++){
                    let item = groupedSensorRecord[t][i];
                    //let tmpTime = []
                    //console.log("item.time:",item.time);
                    time[t][i] = item.time;//moment(item.time).format("YYYY/MM/DD HH:mm:ss");
                    value[t][i] = item.value;
                    if(Date.parse(arrivingTime) == Date.parse(moment(groupedSensorRecord[t][i].time).format("YYYY/MM/DD HH:mm"))){
                      value2[t][i] = item.value;
                    }else if(( i+1 < groupedSensorRecord[t].length && Date.parse(moment(item.time).format("YYYY/MM/DD HH:mm")) <= Date.parse(dispartureTime) &&
                     Date.parse(dispartureTime)< Date.parse(moment(groupedSensorRecord[t][i+1].time).format("YYYY/MM/DD HH:mm"))) ||
                     ( i+1 < groupedSensorRecord[t].length && Date.parse(moment(item.time).format("YYYY/MM/DD HH:mm")) <= Date.parse(arrivingTime) &&
                     Date.parse(arrivingTime) < Date.parse(moment(groupedSensorRecord[t][i+1].time).format("YYYY/MM/DD HH:mm"))) ){
                      value2[t][i] = item.value;
                    }else if(i+1 == groupedSensorRecord[t].length && Date.parse(moment(groupedSensorRecord[t][i].time).format("YYYY/MM/DD HH:mm")) < Date.parse(arrivingTime)){
                      value2[t][i] = item.value;
                    }else {
                      if(!getDeparture &&  Date.parse(dispartureTime) < Date.parse(moment(item.time).format("YYYY/MM/DD HH:mm")) && i==0){
                        getDeparture = true;
                        value2[t][i] = item.value;
                      }else if(!getArrival && Date.parse(arrivingTime) > Date.parse(moment(item.time).format("YYYY/MM/DD HH:mm")) && i+1 == groupedSensorRecord[t].length){
                        getArrival = true;
                        value2[t][i] = item.value;
                      }else{
                        value2[t][i] = null;
                     }
                    }
                }
              }
          });
          this.g_recDateGroup = grouptime;
          this.g_recTime = time;
          this.g_recValue = value;
          this.g_recValue2 = value2;
          /*this.setState({recDateGroup:grouptime});
          this.setState({recTime:time});
          this.setState({recValue:value});
          this.setState({recValue2:value2});*/
          this.setState({recDateIdx:0});
          this.setState({sensorRecord:groupedSensorRecord});


      }else{
        console.log("doGetTransportItem error:",resData.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetTransportItem error",error);
    });
  }

  doSortField = (fieldName,order)=>{
    this.g_transportList = sortByKey(this.g_transportList, fieldName, false, false, order != 'asc');
    //console.log("g_transportList:",this.g_transportList);
    this.setState({transportList:this.g_transportList});
    //this.setState({watchedList:this.g_watchList.slice(0,this.state.showLastIndex)});
  }

  render() {
    const {filtertransport, store} = this.props;
    const transportListParse= this.state.transportList;
    //console.log("transportListParse:",transportListParse);
    const selectStores = [];
    let dateTo = moment().add('1','days').format('YYYY/MM/DD');
    dateTo = moment(dateTo).add('-1','seconds').format('YYYY/MM/DD  HH:mm:ss');
    return(
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
    <div className="Subpage" onClick={(e) => this.handleClickOutside(e)}>
       <DateRangePicker
        From = {this.props.filtertransport.From=="undefined" ? moment().add('-6','days').format('YYYY/MM/DD'):this.props.filtertransport.From}
        To = {this.props.filtertransport.To=="undefined" ? dateTo : this.props.filtertransport.To}
        Type="transport"
        dropdownItems={this.dropdownItems}
        selectedItems={this.props.filtertransport.Filter.length==0 ? [1,2]:this.props.filtertransport.Filter}
        timeLable={Locales.transport.上傳時間}
       />
       {/* <br /> */}
       <TransportStatisitcs transportLists={this.g_transportList} searchfilter={filtertransport}/>
       <div style={{margin: "0 0 1% 0", width:"100%", backgroundColor:"#FFF", height:"100%"}} className="white-space-pre-wrap">
           <InfoList transportLists={transportListParse} searchfilter={filtertransport}
             expandRowId = {this.state.expandRowId}
             onExpand={(e, row) => this.handleExpandRow(e, row)}
             onShowModal={this.handleOpenModal}
             onCloseModal={this.handleCloseModal}
             showModal = {this.state.showModal}
             stopClick = {this.handleStopClick}
             recDateGroup = {this.g_recDateGroup}
             recTime = {this.g_recTime}
             recValue = {this.g_recValue}
             recValue2 = {this.g_recValue2}
             recDateIdx = {this.state.recDateIdx}
             onChangeDate = {this.handleRecDateChanged}
             doSortField = {this.doSortField}
             showLastIndex = {this.state.showLastIndex}
           />
           {/*}<Button className="moreButton" style={{display:this.state.showMoreButton ? 'block':'none'}} onClick={this.handleMoreButton}>{Locales.common.更多}</Button>*/}
       </div>

    </div>
    </BlockUi>
    );
  }
}

function TransportStatisitcs(props){ //連線異常統計圖表
  const {transportLists, searchfilter} = props;
  //console.log(searchfilter);
  let validCount=0,invalidCount=0;
  let filteredLists = [];
  _.map(transportLists, item => {
    if ((searchfilter.Filter.length==2) || //全選
        (item.result) && hasKey(searchfilter.Filter, 1) || //合格
        (!item.result) && hasKey(searchfilter.Filter, 2) //不合格
    ){
      if (item.result) {validCount++;}
      else {invalidCount++;}
      filteredLists.push(item);
    }
  })
  //console.log(itmes);

  const data = {
  labels:[Locales.common.合格,Locales.common.不合格],
	datasets: [{
		data: [validCount,invalidCount],
		backgroundColor: [
      '#1CA9E9',
		  '#FF6565'
		],
		hoverBackgroundColor: [
      '#1CA9E9',
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
          <td colSpan="2" style={{fontSize:"18px", textAlign:"left", color:"#849FB4"}}>{Locales.transport.運輸結果}</td>
        </tr>
        <tr>
          <td style={{fontSize:"3vw", textAlign:"center", width:"80%"}}>{validCount+invalidCount}</td>
          <td style={{fontSize:"14px", textAlign:"left",paddingTop:"20px"}}>{Locales.common.筆}</td>
        </tr>
        <tr>
          <td colSpan="2">
          <table style={{fontSize:"15px",width:"100%"}}>
          <tbody>
          <tr style={{height:"35px"}}>
            <td style={{width:"15px"}}><label style={{backgroundColor:"#FF6565", width:"6.31", height:"22px",width:"6.31px",marginTop: "8px"}}/></td>
            <td style={{fontSize:"18px", textAlign:"left"}}>{Locales.common.不合格}</td>
          </tr>
          <tr style={{height:"35px"}}>
            <td style={{width:"15px"}}><label style={{backgroundColor:"#1CA9E9", width:"6.31", height:"22px",width:"6.31px",marginTop: "8px"}}/></td>
            <td style={{fontSize:"18px", textAlign:"left"}}>{Locales.common.合格}</td>
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
    <StackedBarChart filteredLists={filteredLists} searchfilter={searchfilter}/>
  </div>
</div>
    );
}

function StackedBarChart(props){ // stackBar 圖
    const {filteredLists,searchfilter} = props;
    let startTime = moment(searchfilter.From).format("YYYY/MM/DD"), endTime = moment(searchfilter.To).format("YYYY/MM/DD");
    sortByKey(filteredLists,'updateTime',true);
    let grouped = filteredLists.groupBy('updateTime',true);
    let max= 0;
    let labels=[];
    let valid = [];
    let invalid = [];
    for (let d = new Date(startTime); d <= new Date(endTime); d.setDate(d.getDate() + 1)) {
      let date = moment(d);
      labels.push(date);
      /*if(date==startTime){
        labels.push(date.substr(5,5));
      }else{
        labels.push(date.substr(8,2));
      }*/
      date = moment(d).format("YYYY/MM/DD");
      if(date in grouped){
        //console.log("grouped[date] :",grouped[date] );
        let validCount = 0, invalidCount =0;
        for(let i=0; i< grouped[date].length; i++){
          if (grouped[date][i].result) {validCount++;}
          else {invalidCount++;}
          //console.log("group[",i,"]:",grouped[k][i]);
        }
        let total = validCount+invalidCount;
        valid.push(validCount);
        invalid.push(invalidCount);
        if(total > max){max = total;}
      }else{
        valid.push(0);
        invalid.push(0);
      }
    }
    //console.log("labels",labels);
    let step = Math.round(max/5);
    const data = {
    labels: labels,
    datasets: [
      {
        label: Locales.common.合格,
        backgroundColor: '#1CA9E9',
        borderColor: '#1CA9E9',
        borderWidth: 1,
        stack: '1',
        hoverBackgroundColor: 'rgba(28, 169, 233, 0.7)',
        hoverBorderColor: '#1CA9E9',
        data: valid
      },
      {
        label: Locales.common.不合格,
        backgroundColor: '#FF6565',
        borderColor: '#FF6565',
        borderWidth: 1,
        stack: '1',
        hoverBackgroundColor: 'rgba(255, 101, 101, 0.7)',
        hoverBorderColor: '#FF6565',
        data: invalid
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

function InfoList(props) { //巡檢列表

  const {transportLists, searchfilter, expandRowId, onExpand, recTime,recValue,recValue2,recDateGroup,recDateIdx,onChangeDate, doSortField, showLastIndex} = props;

 let columns = [{
      dataField: 'vendorName',
      text: Locales.transport.廠商名稱,
      headerStyle: { width: '40%' },
      sort: true,
      /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
      formatter: (cell, row, rowIndex, colIndex) => {
        if (row.vendorName) {
          return <span>{row.vendorName}<br/>({row.vendorNo})</span>;
        }
      }
  }, {
      dataField: 'departure',
      text: Locales.transport.發車地點,
      headerStyle: { width: '20%' },
      searchable: true,
      sort: true,
      /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
      formatter: (cell, row, rowIndex, colIndex) => {
        if (row.departure) {
          return <span>{row.departure}<br/><Moment  style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${row.dispartureTime}`}</Moment></span>;
        }
      }
    },{
      dataField: 'terminal',
      text: Locales.transport.終點站,
      headerStyle: { width: '20%' },
      searchable: true,
      sort: true,
      /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
      formatter: (cell, row, rowIndex, colIndex) => {
        if (row.terminal) {
          return <span>{row.terminal}<br/><Moment  style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${row.arrivingTime}`}</Moment></span>;
        }
      }
    },{
      dataField: 'updateTime',
      text: Locales.transport.上傳時間,
      searchable: false,
      headerStyle: { width: '10%' },
      sort: true,
      /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
      formatter: (cell, row, rowIndex, colIndex) => {
          if (row.updateTime) {
            return (
              <Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.updateTime}`}</Moment>);
          }
        }
    },{
      dataField: 'result',
      text: Locales.transport.結果,
      sort: true,
      /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
      searchable: false,
      headerStyle: { width: '10%' },
      formatter: (cell, row, rowIndex, colIndex) => {
        //console.log("row.result:",row.result);
        if (!row.result) {
          return (
              <span style={ { color: '#FF8373' } }>
                {Locales.common.不合格}
              </span>
            );
        }
        return (
            <span style={ { color: '#3D3D3B' } }>{Locales.common.合格}</span>
          );
      }
    }
  ];
  let expandRow = {
    renderer: row => (
      <table className="SelectInfo abnormalBody" onClick={props.stopClick}>
      <tbody>
      <tr id={row.id} onClick={(e) => onExpand(e,row)}>
        <td style={{width:'40%'}}>{row.vendorName}<br />{row.vendorNo} </td>
        <td style={{width:'20%'}}>{row.departure}<br /><Moment  style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${row.dispartureTime}`}</Moment></td>
        <td style={{width:'20%'}}>{row.terminal}<br /><Moment  style={{whiteSpace: "pre"}} format={"HH:mm   YYYY/MM/DD"}>{`${row.arrivingTime}`}</Moment></td>
        <td style={{width:'10%'}}><Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.updateTime}`}</Moment></td>
        <td style={{color:row.result ?'#3D3D3B':'#FF8373',width:'10%'}}>{row.result ? Locales.common.合格:Locales.common.不合格}</td>
      </tr>
      <tr>
      <td colSpan="5" style={{textAlign:"left"}}>
        <div style={{padding:"10px"}}>
          <Tabs defaultActiveKey={1} className="tabStyle" id="abnormalInfo-tab" style={{paddingBottom:"20px"}}>
            <Tab eventKey={1} title={Locales.transport.運送溫度記錄}>
              <TransTempRecords rowData={row}
                recDateGroup = {recDateGroup}
                recTime = {recTime}
                recValue = {recValue}
                recValue2 = {recValue2}
                recDateIdx = {recDateIdx}
                onChangeDate = {onChangeDate}
                dispartureTime = {row.dispartureTime}
                arrivingTime = {row.arrivingTime}/>
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
  //console.log("transportLists:",transportLists);
  for(let i=showLastIndex; i<transportLists.length;i++){
    hiddenRowKeys.push(transportLists[i].id);
  }
  const { SearchBar } = Search;
  const defaultSorted = [{
    dataField: 'updateTime',
    order: 'desc'
  }];
  const searchedField = ["vendorName","terminal","departure"];
  return (
    <CompSearchedTable
      id="tblTransport"
      keyField='id'
      placeholder={Locales.transport.請輸入欲查詢廠商名稱或發車地點或終點站}
      defaultSorted={ defaultSorted }
      data={transportLists}
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
      data={transportLists}
      columns={ columns }
      search
    >
    {
      props => (
      <div>
        <SearchBar { ...props.searchProps }
        style={ { width: '400px', margin:"20px 30px 10px 0",float:"right" } }
        placeholder={Locales.transport.請輸入欲查詢廠商名稱或發車地點或終點站}/>
        <BootstrapTable
          { ...props.baseProps }
          id="tblTransport"
          bordered={ false }
          defaultSorted = {defaultSorted}
          classes='tableList'
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
function TransTempRecords(props) { //事件發生前後紀錄
  let row = props.rowData;
  //let max = -100, min=100,yStepsize = 0;
  let {recDateGroup,recDateIdx,recTime,recValue,recValue2,onChangeDate,dispartureTime,arrivingTime} = props;

  let labelTime = recDateGroup.length>0 ? recTime[recDateGroup[recDateIdx]]:[];
  //console.log("labelTime:",labelTime);
  let dsValue = recDateGroup.length>0 ? recValue[recDateGroup[recDateIdx]]:[];
  //console.log("dsValue:",dsValue );
  let dsValue2 = recDateGroup.length>0 ? recValue2[recDateGroup[recDateIdx]]:[];
  /*for(let i=0; i<dsValue.length;i++){
    if(dsValue[i]!=null && dsValue[i]>max) {max = dsValue[i];}
    if(dsValue[i]!=null && dsValue[i]<min) {min = dsValue[i];}
  }
  if(min==100 && max==-100){
    min = 0;max=0; yStepsize=0;
  }else{
    max = max > 0 ? Math.ceil(max) : Math.floor(max);
    min = min > 0 ? Math.ceil(min) : Math.floor(min);
    yStepsize = Math.abs(max-min)/5;
    max = min + yStepsize*5;
  }
  console.log("min:",min, "max:", max, "yStepsize:",yStepsize);*/
/*測試*/
//  arrivingTime = moment(dispartureTime).add(3,'days').format("YYYY/MM/DD  HH:mm:ss");
/****/
  let labels=[],data1=[],data2=[], timeUnit="", timeUnitStep = 30;
  let startTime = moment(dispartureTime).add(-1,'hours').format("YYYY/MM/DD HH:mm");
  let endTime = moment(arrivingTime).add(1,'hours').format("YYYY/MM/DD HH:mm");
  //console.log("start Time:"+startTime+", end Time:"+endTime);
  let startday = new Date(startTime).getDate();
  let endday = new Date(endTime).getDate();
  //console.log("startDay:"+startday+ " edn day:"+endday);
  let hrDiff = moment(endTime).diff(moment(startTime),'hours');
  if((endday-startday) > 0){ ///出發-抵達不同天
    hrDiff = moment(labelTime[labelTime.length-1]).diff(moment(labelTime[0]),'hours')
  }

  //console.log("hrDiff:",hrDiff);

  if(hrDiff >10){
    timeUnit = 'hour';
    if(hrDiff >18){
      timeUnitStep = 2;
    }else{
      timeUnitStep = 1;
    }
  }else{
    timeUnit = 'minute';
    timeUnitStep = 30;
  }

  if(labelTime.length==0){
    //console.log("labelTime.length==0");
    for (let d = new Date(startTime); d <= new Date(endTime); d.setMinutes(d.getMinutes() + 20)) {
      let time=moment(d);
      labels.push(time);
    }
    /*if((endday-startday) > 0){///出發-抵達不同天 且無sensor資料
      timeUnit = 'hour';
      timeUnitStep = 2;
    }*/
  }else{
    if(recDateIdx==0){//資料與出發同一天
      let d = new Date(startTime);
      labels.push(moment(d));
      data1.push(null);
      data2.push(null);
    }
    for(var i=0 ; i<labelTime.length ; i++) {
      if(Date.parse(startTime)<= Date.parse(moment(labelTime[i]).format("YYYY/MM/DD HH:mm")) &&
          Date.parse(moment(labelTime[i]).format("YYYY/MM/DD HH:mm")) <= Date.parse(endTime)){
        labels.push(moment(labelTime[i]));
        data1.push(dsValue[i]);
        data2.push(dsValue2[i]);
      }
      //if(row[i].temperature > max){max=row[i].temperature;}
      //if(row[i].temperature < min){min=row[i].temperature;}
    }
    if(recDateIdx+1==recDateGroup.length){//資料與抵達同一天
      let ed = new Date(endTime);
      labels.push(moment(ed));
      data1.push(null);
      data2.push(null);
    }
  }
    var data = {
    animation: false,
    labels: labels,
    datasets: [
      {
        label: Locales.transport.發車_到店溫度,
        fill: false,
        backgroundColor: '#0b7d9f',
        borderColor: '#0b7d9f',
        radius: 5,
        pointBackgroundColor: '#0b7d9f',
        hoverBackgroundColor: '#0b7d9f',
        hoverBorderColor: '#0b7d9f',
        data: data2
      },{
      label: Locales.transport.溫度,
      fill: false,
      backgroundColor: 'rgba(1,1,1,0)',
      borderColor: 'rgba(255,99,132,1)',
      borderWidth: 1,
      strokeColor:'#0b7d9f',
      pointBackgroundColor: 'rgba(255,99,132,1)',
      hoverBackgroundColor: 'rgba(255,99,132,0.4)',
      hoverBorderColor: 'rgba(255,99,132,1)',
      data: data1
    }]
  };
  //console.log("min:",min," max:",max);
  var options = {
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
            return moment(tooltipItem[0].xLabel).format("HH:mm   MM/DD");
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
          bounds:'data',
          time: {
            unit: timeUnit,
            unitStepSize: timeUnitStep,
           displayFormats: {
             'hour': 'HH:mm',
             'minute':'HH:mm'
           }
         },
          ticks: {
            maxRotation:0,
            source:'auto' // 使用label 取理想間距
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
  return (
    <div style={{paddingTop: "10px"}}>
      <table style={{width:"100%", display:recDateGroup.length>1?"inlin-block":"none"}}>
        <tbody style={{boxShadow:"none",border:"none"}}>
          <tr>
            <td style={{width:"43%", textAlign:"right", border:"none"}}><Button className="btnChartDateChanged1" disabled={recDateIdx==0} onClick={()=>onChangeDate("Subtract")}>〈</Button></td>
            <td style={{width:"14%", border:"none"}}><label style={{color:'#0B7D9F'}}>{recDateGroup[recDateIdx]}</label></td>
            <td style={{width:"43%",textAlign:"left", border:"none"}}><Button className="btnChartDateChanged2" disabled={recDateIdx+1==recDateGroup.length} onClick={()=>onChangeDate("add")}>〉</Button></td>
          </tr>
        </tbody>
      </table>
      <div style={{paddingTop: "10px"}}>
          <Line
          data={data}
          options={options}
          height={50}
          datasetKeyProvider={()=>{ return Math.random(); }}
          />
      </div>
    </div>
  );
}


function mapStateToProps({store, token, transportlist,filtertransport}, ownProps) {
    return { store, token, transportlist,filtertransport};
  }


  //this.props.fetchPost
  //this.props.deletePost
  export default connect(mapStateToProps, {setTransportList,setTransportFilter})(TransportSubpage);
