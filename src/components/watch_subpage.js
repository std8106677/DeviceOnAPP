import React, { Component } from "react";
import moment from 'moment';
import { connect } from "react-redux";
import { setUser,setWatchList,setWatchFilter } from "../actions";
import { Tab, Tabs, Button,Form, FormGroup, FormControl, ControlLabel,Col, DropdownButton, MenuItem} from "react-bootstrap";
import BootstrapTable from 'react-bootstrap-table-next';
import { apiDataRetrieve,apiFreezerInfo,apiFreezerList,apiDataTransaction,toCancelApi } from "../utils/api";
import {hasKey, sortByKey, pageStore,showRowNum} from "../utils/common"
import { Redirect } from "react-router-dom";
import {Doughnut, Bar} from "react-chartjs-2";
import "chartjs-plugin-annotation";
import ReactModal from 'react-modal';
import Moment from 'react-moment';
import DateRangePicker from "../components/comp_DateRangeFilter";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import {Locales} from '../lang/language';
import BlockUi from 'react-block-ui';
import {CompSearchedTable} from "../components/comp_Table";

class WatchSubpage extends Component {
  constructor(props) {
    super(props);
    this.token={};
    this.dropdownItems = [{value:1,label:Locales.common.合格},{value:2,label:Locales.common.不合格}];
    this.dropdownOther = [];
    this.allOtherId = [];
    this.g_watchList = this.props.watchlist;
    //this.showRowNum = 20;
    this.selStoreCount=0;
    this.countList=0;
    this.state={
      total:0,
      expandRowId:null,
      showModal: false,
      //dropdownOther : [],
      //allOtherId : [],
      watchedList : (this.g_watchList.length > showRowNum )?this.g_watchList.slice(0,showRowNum):this.g_watchList,
      //showMoreButton:(this.g_watchList.length > this.showRowNum )?true:false,
      //showLastIndex:this.showRowNum,
      itemImg:"",
      blocking:false
    };
     //image modal show handle
     this.handleOpenModal = this.handleOpenModal.bind(this);
     this.handleCloseModal = this.handleCloseModal.bind(this);
     //this.handleMoreButton = this.handleMoreButton.bind(this);
  }
  componentWillUnmount(){
    toCancelApi();
  }

  componentWillReceiveProps(nextProps) {
    //console.log("store:",this.props.store);
    //console.log("componentWillReceiveProps:",nextProps);
    //console.log("searchfilter",this.props.searchfilter);
    let isChanged = false;
    this.token = nextProps.token

    //console.log("token",this.token);
    const {filterwatch, store} = nextProps;
    if(filterwatch.doSearch ||
      (this.props.filterwatch.From != filterwatch.From ||
        this.props.filterwatch.To != filterwatch.To ||
        !Object.compare(this.props.filterwatch.Filter,filterwatch.Filter))
      ){
      isChanged = true;
      this.props.setWatchFilter({From:filterwatch.From,To:filterwatch.To, Filter:filterwatch.Filter, FilterType:filterwatch.FilterType,doSearch:false});
    }
    let startTime = (typeof filterwatch.From!="undefined")? filterwatch.From : moment().add('-6','days').format('YYYY-MM-DD HH:mm:ss');
    let endTime = (typeof filterwatch.To!="undefined")? filterwatch.To : moment().format('YYYY-MM-DD HH:mm:ss');
    //console.log("start:",startTime," end:",endTime);
    if(typeof store === "object" && (store instanceof Array)){
      let selstores = store.filter(s => s.select == true);
      this.selStoreCount = selstores.length;
      //let preselstores = this.props.store.filter(s => s.select == true);
      if(!Object.compare(selstores,pageStore.watch.selStores)){
        pageStore.watch.selStores = selstores;
        isChanged = true;
      }
      if(isChanged){
        //console.log("requery");
        this.setState({blocking: true});
        this.g_watchList = [];
        this.countList=0;
        if(selstores.length == 0){
          this.setState({watchedList:this.g_watchList,blocking:false,showMoreButton:false});
          this.props.setWatchList(this.g_watchList);
        }
        _.map(selstores, item =>{
          this.doGetWatchedList(item.branch_id,item.branch_name,startTime, endTime, filterwatch);
        });
      }
    }
    //this.doGetFreezerList("rrn5eh8u"); //fill dropdownOther
    //this.doGetWatchedList("rrn5eh8u","test",startTime, endTime, searchfilter);
  }

  handleExpandRow(e, id) {
    //console.log("openDetailTempID, ", id);
    if(id != this.state.expandRowId) {
      this.setState({itemImg:[],expandRowId: id});
      this.doGetInspectItem(id);
      //this.setState({expandRowId: id});
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

  handleOpenModal (e) {
    this.setState({ showModal: true });
    e.stopPropagation();
  }

  handleCloseModal (e) {

    this.setState({ showModal: false });
    e.stopPropagation();
  }

  /*handleMoreButton(){
    let nowindex = this.state.showLastIndex+this.showRowNum;
    if(this.g_watchList.length > nowindex){
      //this.setState({watchedList:this.g_watchList.slice(0,nowindex)});
      this.setState({showLastIndex:nowindex});
    }else{
      //this.setState({watchedList:this.g_watchList.slice(0,this.g_watchList.length)});
      this.setState({showLastIndex:this.g_watchList.length,showMoreButton:false});
    }
  }*/

  doGetWatchedList(branchId, branchName,startTime, endTime,searchfilter){

    let data = {type:"inspect",targetId:branchId,startTime:startTime,endTime:endTime,token:this.token}
    //console.log("branchId:",branchId);
    apiDataRetrieve(data)
    .then(async (response)=>{
      if(response.data.status == 1){
        let resData = response.data.transaction_datas;
        //console.log("resData:",resData);
        //console.log("count:",this.countList," totalCount",this.selStoreCount);
        //console.log("resData:",resData);
        //console.log("resData:",resData[0]);
        for(let i=0; i<resData.length; i++){
            let content = resData[i].content;
            //console.log("transaction_data content:",content);
            //if( typeof searchfilter.FilterOther=='undefined'||searchfilter.FilterOther.includes(content.freezer_id)){
            if ((searchfilter.Filter.length==2) || //全選
                (content.result) && hasKey(searchfilter.Filter, 1) || //合格
                (!content.result) && hasKey(searchfilter.Filter, 2) //不合格
            ){
              if(typeof content.freezer_id!="undefined"){
                  let freezer = await apiFreezerInfo({freezer_id:content.freezer_id,token:this.token});//this.doGetFreezerName(content.freezer_id);
                  let freezerName = freezer.data.freezer.name;
                  //console.log("freezerName:",freezerName);
                  this.g_watchList.push(
                      {id:resData[i].id, freezer:freezerName, freezerId:content.freezer_id, branch:branchName, itemName:content.product.name,
                        measuringTime:resData[i].timestamp,temperature:content.product.temperature,result:content.result
                      }
                    );
                }
             }
        }
        this.countList=this.countList+1;
        if(this.selStoreCount == this.countList){
          this.g_watchList = sortByKey(this.g_watchList, "measuringTime",true,false,true);
          if(this.g_watchList.length > this.state.showLastIndex ){
            //this.setState({watchedList:this.g_watchList.slice(0,this.state.showLastIndex)});
            this.setState({watchedList:this.g_watchList,blocking:false});
          }else{
            //this.setState({watchedList:this.g_watchList});
            this.setState({watchedList:this.g_watchList,blocking:false});
          }
          //this.setState({watchedList:this.g_watchList});
          this.props.setWatchList(this.g_watchList);
        }
      }else{
        console.log("get watchedList error:",response.data);
        if(this.selStoreCount == this.countList){
          this.setState({blocking:false});
        }
      }

    })
    .catch((error)=>{
      console.log("doGetWatchedList error:",error);
      this.setState({blocking:false});
    });
  }

  doGetFreezerName(freezerId){
    apiFreezerInfo({freezer_id:freezerId,token:this.token})
    .then(function (resData){
      if(resData.data.status==1){
        //console.log("Freezer Info:",resData.data);
        return resData.data.freezer.name;
      }else{
        console.log("get Freezer Name error:",resData.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetFreezerName erroe",error);
    });

  }

  doGetFreezerList(branchId){
    apiFreezerList({branch_id:branchId,token:this.token})
    .then(function (resData){
      if(resData.data.status==1){
        let freezers = resData.data.freezers;
        for(let i =0; i<freezers.length;i++){
          //console.log("freezers:",freezers[i]);
          this.dropdownOther.push({value:freezers[i].freezer_id,label:freezers[i].name});
          this.allOtherId.push(freezers[i].freezer_id);
        }
        //this.state.setState({dropdownOther:this.g_dropdownOther})
        //this.state.setState({allOtherId:this.g_allOtherId})
      }else{
        console.log("get Freezer List error:",resData.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetFreezerList erroe",error);
    });
  }

  doGetInspectItem(ispectId){
    apiDataTransaction({transactionId:ispectId,token:this.token})
    .then(function (resData){
      if(resData.data.status==1){
        let transaction = resData.data;
        //console.log(" transaction", transaction.content.product.pic_idx.length);
        //let imgIdx = transaction.content.product.pic_idx.length-1; //取最後一張
        //console.log("imgIdx:", imgIdx);
        if(transaction.pictures.length > 0 && transaction.pictures[0].trim()!=""){
          this.setState({itemImg:'data:image/jpeg;base64,'+transaction.pictures[0]});
        }else{
          this.setState({itemImg:""});
          console.log("No picture can show。transaction.pictures.length:", transaction.pictures.length);
        }
        //this.state.setState({dropdownOther:this.g_dropdownOther})
        //this.state.setState({allOtherId:this.g_allOtherId})
      }else{
        console.log("get Freezer List error:",resData.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetInspectItem error",error);
    });
  }

  doSortField = (fieldName,order)=>{
    this.g_watchList = sortByKey(this.g_watchList, fieldName, false, false, order != 'asc');
    this.setState({watchedList:this.g_watchList});
    //this.setState({watchedList:this.g_watchList.slice(0,this.state.showLastIndex)});
  }

  render() {
    //this.initial();
    var height = window.innerHeight;
    height = height-200-(height*0.16)-(height*0.21)-(height*0.01);//-top banner, -時間搜尋(含margin 1%), -barchart(含margin 1%), -margin-bottom 1%
    //console.log("height:",height);
    const {filterwatch, store} = this.props;
    const watchListParse= this.state.watchedList;
    let minHeight = 30+50+34; //搜尋+margin+tHead
    //console.log("1.minHeight:",minHeight);
    let tbodyH = 50*watchListParse.length+30+50+34;
    //console.log("tbodyH:",tbodyH);
    if((height-25) <= tbodyH && tbodyH <= (height+25)){
      minHeight = height+50;
      //console.log("2.minHeight:",minHeight);
    }
    const selectStores = [];
    let dateTo = moment().add('1','days').format('YYYY/MM/DD');
    dateTo = moment(dateTo).add('-1','seconds').format('YYYY/MM/DD  HH:mm:ss');
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
      <div className="Subpage" onClick={(e) => this.handleClickOutside(e)}>

         <DateRangePicker
           From = {filterwatch.From=="undefined" ? moment().add('-6','days').format('YYYY/MM/DD'):filterwatch.From}
           To = {filterwatch.To=="undefined" ? dateTo : filterwatch.To}
           Type="watch"
           dropdownItems={this.dropdownItems}
           selectedItems={this.props.filterwatch.Filter.length==0 ? [1,2]:this.props.filterwatch.Filter}
         />
         {/* <br /> */}
         <WatchedStatisitcs watchLists={this.g_watchList} searchfilter={filterwatch}/>
         <div style={{margin: "0 0 1% 0", width:"100%", backgroundColor:"#FFF", minHeight:`${minHeight}px`}}>
           <InfoList watchLists={this.g_watchList} searchfilter={filterwatch}
             expandRowId = {this.state.expandRowId}
             onExpand={(e, id) => this.handleExpandRow(e, id)}
             onShowModal={this.handleOpenModal}
             onCloseModal={this.handleCloseModal}
             showModal = {this.state.showModal}
             clickCB_Outside={(e) => this.handleClickOutside(e)}
             stopClick = {this.handleStopClick}
             itemImg = {this.state.itemImg}
             doSortField = {this.doSortField}
             showLastIndex = {this.state.showLastIndex}
             onTableChange = {this.onTableChange}
           />
           {/*<Button className="moreButton" style={{display:this.state.showMoreButton ? 'block':'none'}} onClick={this.handleMoreButton}>{Locales.common.更多}</Button>*/}
         </div>

      </div>
      </BlockUi>
    );
  }
}
function WatchedStatisitcs(props){ //連線異常統計圖表
  const {watchLists, searchfilter} = props;
  //console.log(searchfilter);
  let validCount=0,invalidCount=0;
  let filteredLists = [];
  _.map(watchLists, item => {
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
          <td colSpan="2" style={{fontSize:"18px", textAlign:"left", color:"#849FB4"}}>{Locales.watch.巡檢結果}</td>
        </tr>
        <tr>
          <td style={{fontSize:"60px", textAlign:"center", width:"80%"}}>{validCount+invalidCount}</td>
          <td style={{fontSize:"22px", textAlign:"left",paddingTop:"20px"}}>{Locales.common.筆}</td>
        </tr>

        <tr>
          <td colSpan="2">
          <table style={{fontSize:"18px",width:"100%"}}>
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
    sortByKey(filteredLists,'measuringTime',true);
    let grouped = filteredLists.groupBy('measuringTime',true);
    let max= 0;
    let labels=[];
    let valid = [];
    let invalid = [];
    for (let d = new Date(startTime); d <= new Date(endTime); d.setDate(d.getDate() + 1)) {
      let date = moment(d);//.format("YYYY/MM/DD");
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
    /*Object.keys(grouped).forEach(function(k){
      labels.push(k);
      //console.log("k:",k);
      let validCount = 0, invalidCount =0;
      for(let i=0; i< grouped[k].length; i++){
        if (grouped[k][i].result) {validCount++;}
        else {invalidCount++;}
        //console.log("group[",i,"]:",grouped[k][i]);
      }
      let total = validCount+invalidCount;
      valid.push(validCount);
      invalid.push(invalidCount);
      if(total > max){max = total;}
    });*/

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
        /*time: {
         unit: 'day',
         distribution: 'linear',
         displayFormats: {
           'millisecond': 'MMM DD',
           'second': 'MMM DD',
           'minute': 'MMM DD',
           'hour': 'MMM DD',
           'day': 'MM/DD',
           'week': 'MM/DD',
           'month': 'MM/DD',
           'quarter': 'MMM DD',
           'year': 'MMM DD',
         }
       },*/
       barThickness:'flex',
        distribution: 'series',
				gridLines: {
					display: false,
          stacked: true,
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

  const {watchLists, searchfilter, expandRowId, onExpand, doSortField, showLastIndex, onTableChange} = props;
  //console.log("itemImg:",props.itemImg);

  const columns = [
    {
      dataField: 'freezer',
      text: Locales.watch.冷凍櫃,
      sort:true,
      /*onSort: (field, order) => {
          doSortField(field,order);
        }*/
    }, {
      dataField: 'branch',
      text: Locales.watch.門市,
      sort:true,
      /*onSort: (field, order) => {
          doSortField(field,order);
      },*/
      //filter: textFilter(),
      filterValue: (cell, row) => {console.log("cell",cell,"rwo",row)}
    }, {
      dataField: 'itemName',
      text: Locales.watch.品名,
      searchable: false,
      sort:true,
      /*onSort: (field, order) => {
          doSortField(field,order);
      }*/
    },{
      dataField: 'measuringTime',
      text: Locales.watch.量測時間,
      searchable: false,
      sort:true,
      /*onSort: (field, order) => {
          doSortField(field,order);
      },*/
      formatter: (cell, row, rowIndex, colIndex) => {
          if (row.measuringTime) {
            return moment(row.measuringTime).format("HH:mm YYYY-MM-DD");
          }
        }
    },{
      dataField: 'temperature',
      text: Locales.watch.品溫,
      searchable: false,
      sort:true,
      /*onSort: (field, order) => {
          doSortField(field,order);
      },*/
      formatter: (cell, row, rowIndex, colIndex) => {
        if (!row.result) {
          return (
              <span style={ { color: '#FF8373' } }>
                {row.temperature+ '°C'}
              </span>
            );
        }
        return (
            <span style={ { color: '#3D3D3B' } }>{row.temperature+ '°C'}</span>
          );
      }
    },{
      dataField: 'result',
      text: Locales.watch.巡檢結果,
      searchable: false,
      sort:true,
      /*onSort: (field, order) => {
          doSortField(field,order);
      },*/
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

  const modalStyles = {
    overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
    content : {
      top                   : '50%',
      left                  : '50%',
      right                 : 'auto',
      bottom                : 'auto',
      marginRight           : '-50%',
      transform             : 'translate(-50%, -50%)',
      backgroundColor:'rgb(0,0,0,0)',
      border:'none',
      overlay:{zIndex:10,backgroundColor:'rgb(0,0,0,0.3)'}
    }
  };
  //console.log("props.itemImg=",props.itemImg);
  let expandRow = {
    renderer: row => (
      <table className="SelectInfo abnormalBody" onClick={props.stopClick}>
      <tbody>
      <tr id={row.id} onClick={(e, id) => onExpand(e,id)}>
        <td>{row.freezer}</td>
        <td>{row.branch}</td>
        <td>{row.itemName}</td>
        <td><Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.measuringTime}`}</Moment></td>
        <td style={{color:row.result?'#3D3D3B':'#FF8373'}}>{row.temperature+ '°C'}</td>
        <td style={{color:row.result?'#3D3D3B':'#FF8373'}}>{row.result?Locales.common.合格:Locales.common.不合格}</td>
      </tr>
      <tr>
      <td colSpan="6" style={{textAlign:"left"}}>
      <div>
        <img src={props.itemImg} style={{width:"151px", height:"271px", margin:"5px 0 5px 20px", cursor:"pointer", visibility:props.itemImg==""?'hidden':'visible'}} onClick={props.onShowModal}/>
        <ReactModal
           isOpen={props.showModal}
           contentLabel="Minimal Modal Example"
           style={modalStyles}
           onRequestClose={props.onCloseModal}
           shouldCloseOnOverlayClick={true}
        >
          <div style={{width:"800px", height:"852px"}}>
            <img src={props.itemImg} style={{width:"624px", height:"832px"}} />
            <button onClick={props.onCloseModal} style={{position:"fixed", marginLeft:"40px",fontSize:"80px", color:"#FFF", backgroundColor:"rgb(0,0,0,0)",border:"none"}}>X</button>
          </div>
        </ReactModal>
      </div>
      </td>
      </tr>
      </tbody>
      </table>
    ),onlyOneExpanding: true,
    expanded: [expandRowId],
    onExpand: (row, isExpand, rowIndex, e) => {
      //console.log("row.id:",row.id);
      onExpand(e,row.id);
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
  const { SearchBar } = Search;
  let hiddenRowKeys=[];

  /*for(let i=showLastIndex; i<watchLists.length;i++){
    hiddenRowKeys.push(watchLists[i].id);
  }*/
  const defaultSorted = [{
    dataField: 'measuringTime',
    order: 'desc'
  }];
  const searchedField = ["freezer","branch"];
  //console.log("watchLists:",watchLists)
  return (
    <CompSearchedTable
      id="tblWatch"
      keyField='id'
      placeholder={Locales.watch.請輸入欲查詢冷凍櫃或門市名稱}
      defaultSorted={ defaultSorted }
      data={watchLists}
      columns={ columns }
      //hiddenRows={ hiddenRowKeys }
      expandRow={ expandRow }
      rowClasses = {rowClasses}
      rowEvents={ rowEvents }
      searchedField = {searchedField}
      showLastIndex = {showLastIndex}
    />
    /*}<ToolkitProvider
      keyField='id'
      data={watchLists}
      columns={ columns }
      search
    >
    {
      props => (
        <div>
          <SearchBar { ...props.searchProps }
            style={ { width: '330px', margin:"20px 30px 10px 0",float:"right" } }
            placeholder={Locales.watch.請輸入欲查詢冷凍櫃或門市名稱}
          />
          <BootstrapTable
            { ...props.baseProps }
            id="tblWatch"
            keyField='id'
            bordered={ false }
            defaultSorted={ defaultSorted }
            classes='tableList'
            headerClasses = 'tableHeader'
            data={watchLists}
            columns={ columns }
            hiddenRows={ hiddenRowKeys }
            expandRow={ expandRow }
            rowClasses = {rowClasses}
            rowEvents={ rowEvents }
            remote={ { pagination: false, filter: true, sort: false,search:true } }
            onTableChange={onTableChange}
            //filter={ filterFactory()}
          />
        </div>
     )
  }
</ToolkitProvider>*/
  );
}



function mapStateToProps({store, token, filterwatch,watchlist}, ownProps) {
    return { store, token, filterwatch,watchlist};
  }


  //this.props.fetchPost
  //this.props.deletePost
  export default connect(mapStateToProps, {setWatchList,setWatchFilter})(WatchSubpage);
