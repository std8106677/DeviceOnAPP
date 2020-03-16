import React, { Component } from "react";
import moment from 'moment';
import { connect } from "react-redux";
import { setUser,setGoodsList,setGoodsFilter } from "../actions";
import { Tab, Tabs, Button,Form, FormGroup, FormControl, ControlLabel,Col, DropdownButton, MenuItem} from "react-bootstrap";
import BootstrapTable from 'react-bootstrap-table-next';
import { apiDefineList,apiDataRetrieve,apiDataTransaction,toCancelApi } from "../utils/api";
import {hasKey, sortByKey, pageStore} from "../utils/common";
import { Redirect } from "react-router-dom";
import {Doughnut, Bar} from "react-chartjs-2";
import "chartjs-plugin-annotation";
import Moment  from '../components/moment_custom'
import ReactModal from 'react-modal';
import DateRangePicker from "../components/comp_DateRangeFilter";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import {Locales} from '../lang/language';
import BlockUi from 'react-block-ui';
import {CompSearchedTable} from "../components/comp_Table";
class GoodsSubpage extends Component {
  constructor(props) {
    super(props);
    this.token={};
    this.dropdownItems = [{value:1,label:Locales.common.合格},{value:2,label:Locales.common.不合格}];
    //this.dropdownOther=[];
    //this.allOtherId = [];
    this.g_goodsList = this.props.goodslist;
    this.showRowNum = 20;
    this.selStoreCount =0;
    this.countList=0;
    this.carCleanList = [];
    this.doGetCarCleanDefine();
    //console.log("this.g_goodsList",this.g_goodsList);
    this.state={
      total:0,
      goodsResultCount:[0,0],
      goodsList:(this.g_goodsList.length > this.showRowNum )?this.g_goodsList.slice(0,this.showRowNum ):this.g_goodsList ,
      expandRowId:null,
      showModal: false,
      modalImg:"",
      showMoreButton:(this.g_goodsList.length > this.showRowNum )?true:false,
      showLastIndex:this.showRowNum,
      itemImgs:["",""]
    };
     //image modal show handle
     this.handleOpenModal = this.handleOpenModal.bind(this);
     this.handleCloseModal = this.handleCloseModal.bind(this);
     this.handleMoreButton = this.handleMoreButton.bind(this);
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

    //this.g_dropdownOther = [];
    //this.g_allOtherId = [];
    const {filtergoods, store} = nextProps;
    //console.log("doSearch",filtergoods.doSearch);
    if(filtergoods.doSearch ||
      (this.props.filtergoods.From != filtergoods.From ||
        this.props.filtergoods.To != filtergoods.To ||
        !Object.compare(this.props.filtergoods.Filter,filtergoods.Filter))
      ){
      isChanged = true;
      this.props.setGoodsFilter({From:filtergoods.From,To:filtergoods.To, Filter:filtergoods.Filter, FilterType:filtergoods.FilterType,doSearch:false});
    }
    let startTime = (typeof filtergoods.From!="undefined")? filtergoods.From : moment().add('-6','days').format('YYYY-MM-DD HH:mm:ss');
    let endTime = (typeof filtergoods.To!="undefined")? filtergoods.To : moment().format('YYYY-MM-DD HH:mm:ss');
    if(typeof store === "object" && (store instanceof Array)){
      let selstores = store.filter(s => s.select == true);
      this.selStoreCount = selstores.length;
      //let preselstores = this.props.store.filter(s => s.select == true);
      if(!Object.compare(selstores,pageStore.good.selStores)){
        pageStore.good.selStores = selstores;
        isChanged = true;
        //console.log("selected store changed");
      }
      //this.g_transportList = transportlist;
      if(isChanged){
        //console.log("requery");
        this.setState({blocking: true});
        this.g_goodsList = [];
        this.countList=0;
        if(selstores.length == 0){
          this.setState({goodsList:this.g_goodsList,blocking:false,showMoreButton:false});
          this.props.setGoodsList(this.g_goodsList);
        }
        _.map(selstores, item =>{
          this.doGetGoodsList(item.branch_id,item.branch_name,startTime, endTime, filtergoods);
        });
      }
    }
    //this.doGetVendorList(); //fill dropdownOther
    //this.doGetGoodsList("rrn5eh8u","test",startTime, endTime, searchfilter);
  }

  handleExpandRow(e, id) {
    //console.log("openDetailTempID, ", id);
    if(id != this.state.expandRowId) {
      this.setState({itemImgs:["",""],expandRowId: id});
      this.doGetReceiptItem(id);
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

  handleOpenModal (e,img) {
    e.stopPropagation();
    this.setState({ showModal: true, modalImg:img  });
  }

  handleCloseModal (e) {
    e.stopPropagation();
    this.setState({ showModal: false, modalImg:"" });
  }

  handleMoreButton(){
    let nowindex = this.state.showLastIndex+this.showRowNum;
    if(this.g_goodsList.length > nowindex){
      //this.setState({goodsList:this.g_goodsList.slice(0,nowindex)});
      this.setState({showLastIndex:nowindex});
    }else{
      //this.setState({goodsList:this.g_goodsList.slice(0,this.g_goodsList.length)});
      this.setState({showLastIndex:this.g_goodsList.length,showMoreButton:false});
      //this.setState({showMoreButton:false});
    }
  }

  doGetCarCleanDefine = () =>{
    let data = {type: "car_clean", token: this.props.token};
    apiDefineList(data)
    .then(function(response){ //加入async 因為必須等 細部資訊都回來才set state
      if(response.data.status==1){
        let data = response.data.defines;
        sortByKey(data,'code',false,true);
        this.carCleanList = data;
        //console.log("carCleanList:",this.carCleanList);
      }else{
        console.log("doGetDefinByType error response:",response);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetDefinByType error:",error);
    });
  }

  doGetGoodsList(branchId, branchName,startTime, endTime,searchfilter){
    //console.log("count:",count," totalCount",this.selStoreCount);
    let data = {type:"receipt",targetId:branchId,startTime:startTime,endTime:endTime,token:this.token}
    //console.log("g_goodsList.length",this.g_goodsList.length);
    //console.log("searchdata:",data);
    apiDataRetrieve(data)
    .then(async (response)=> {
      if(response.data.status == 1){
        let resData = response.data.transaction_datas;
        for(let i=0; i<resData.length; i++){
            let content = resData[i].content;
            //console.log("transaction_data content:",content);
            //if( typeof searchfilter.FilterOther=='undefined'||searchfilter.FilterOther.includes(content.vendor.code)){
              //console.log("freezerName:",freezerName);
              if ((searchfilter.Filter.length==2) || //全選
                  (content.result) && hasKey(searchfilter.Filter, 1) || //合格
                  (!content.result) && hasKey(searchfilter.Filter, 2) //不合格
              ){
                  let transportCleanHL = this.carCleanList.filter(define => {
                    return (define.id == content.transport.clean.id);
                  });
                  //console.log("transportCleanHL:",transportCleanHL);
                  this.g_goodsList.push(
                    {id:resData[i].id, vendorNo:content.vendor.code, vendorName:content.vendor.name, vendor:content.vendor.name+"\r\n("+content.vendor.code+")",store:branchName,
                      itemName:content.product.name,temperature:content.product.temperature,cartemp:content.transport.temperature,
                      carResult:content.transport.clean.name,isHighlight:transportCleanHL.length == 0? false:transportCleanHL[0].extension.isHighLight,
                      measuringTime:resData[i].timestamp, result:content.result
                    });
                }
        }

        this.countList=this.countList+1;
        if(this.selStoreCount == this.countList){
          //console.log("this.showRowNum:",this.showRowNum," this.g_goodsList.length:",this.g_goodsList.length)
          this.g_goodsList = sortByKey(this.g_goodsList, "measuringTime",true,false,true);
          if(this.g_goodsList.length > this.state.showLastIndex ){
            //this.setState({goodsList:this.g_goodsList.slice(0,this.state.showLastIndex)});
            this.setState({showMoreButton:true});
          }else{
            this.setState({showMoreButton:false});
          }
          this.props.setGoodsList(this.g_goodsList);
          this.setState({goodsList:this.g_goodsList,blocking:false});
        }

      }else{
        console.log("get goodsList error:",response.data);
        if(this.selStoreCount == this.countList){
          this.setState({blocking:false});
        }
      }

    })
    .catch((error) =>{
      console.log("doGetgoodsList error:",error);
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
          this.dropdownOther.push({value:data[i].code,label:data[i].name});
          this.allOtherId.push(data[i].code);
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


  doGetReceiptItem(receiptId){
    apiDataTransaction({transactionId:receiptId,token:this.token})
    .then(function (resData){
      if(resData.data.status==1){
        let transaction = resData.data;
        //console.log(" transaction", transaction.desc.product.pic_idx.length);
        //console.log("transaction.pictures, ", transaction.pictures);
        let imgProductIdx = transaction.content.product.pic_idx[0]; //取最後一張 2019/3/5
        let imgTransportIdx = transaction.content.transport.pic_idx[0]; //取最後一張 2019/3/5
        //console.log("imgProductIdx", imgProductIdx);
        //console.log("imgTransportIdx",imgTransportIdx);
        if(typeof transaction.pictures[imgProductIdx]=="undefined"){ console.log("Produc image is empty");}
        if(typeof transaction.pictures[imgTransportIdx]=="undefined"){ console.log("Transport image is empty");}
        this.setState({itemImgs:[(typeof transaction.pictures[imgProductIdx]=="undefined") ?'':'data:image/jpeg;base64,'+transaction.pictures[imgProductIdx],
                                (typeof transaction.pictures[imgTransportIdx]=="undefined")?'':'data:image/jpeg;base64,'+transaction.pictures[imgTransportIdx]
                              ]});
        //this.state.setState({dropdownOther:this.g_dropdownOther})
        //this.state.setState({allOtherId:this.g_allOtherId})
      }else{
        console.log("doGetReceiptItem error:",resData.data);
      }
    }.bind(this))
    .catch(function (error) {
      console.log("doGetReceiptItem error",error);
    });
  }

  doSortField = (fieldName,order)=>{
    this.g_goodsList = sortByKey(this.g_goodsList, fieldName, false, false, order != 'asc');
    this.setState({goodsList:this.g_goodsList});
    //this.setState({watchedList:this.g_watchList.slice(0,this.state.showLastIndex)});
  }

  render() {
    const {filtergoods, store} = this.props;
    const goodsListParse= this.state.goodsList;
    const selectStores = [];
    //console.log("itemImg",this.state.itemImgs);
    let dateTo = moment().add('1','days').format('YYYY/MM/DD');
    dateTo = moment(dateTo).add('-1','seconds').format('YYYY/MM/DD  HH:mm:ss');
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
      <div className="Subpage" onClick={(e) => this.handleClickOutside(e)}>
         <DateRangePicker
           From = {filtergoods.From=="undefined" ? moment().add('-6','days').format('YYYY/MM/DD'):filtergoods.From}
           To = {filtergoods.To=="undefined" ? dateTo : filtergoods.To}
           Type="goods"
           dropdownItems={this.dropdownItems}
           selectedItems={this.props.filtergoods.Filter.length==0 ? [1,2]:this.props.filtergoods.Filter}/>
         {/* <br /> */}
         <GoodsStatisitcs goodsLists={this.g_goodsList} searchfilter={filtergoods}/>
         <div style={{margin: "0 0 1% 0", width:"100%", backgroundColor:"#FFF", height:"100%"}}>
           <InfoList goodsLists={this.g_goodsList} searchfilter={filtergoods}
             expandRowId = {this.state.expandRowId}
             onExpand={(e, id) => this.handleExpandRow(e, id)}
             onShowModal={this.handleOpenModal}
             onCloseModal={this.handleCloseModal}
             showModal = {this.state.showModal}
             modalImg = {this.state.modalImg}
             stopClick = {this.handleStopClick}
             itemImg = {this.state.itemImgs}
             doSortField = {this.doSortField}
             showLastIndex = {this.state.showLastIndex}
           />
           {/*<Button className="moreButton" style={{visibility:this.state.showMoreButton ? 'visible':'hidden'}} onClick={this.handleMoreButton}>{Locales.common.更多}</Button>*/}
         </div>
      </div>
      </BlockUi>
    );
  }
}
function GoodsStatisitcs(props){ //連線異常統計圖表
  const {goodsLists, searchfilter} = props;
  //console.log(searchfilter);
  let validCount=0,invalidCount=0;
  let filteredLists = [];
  _.map(goodsLists, item => {
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
          <td colSpan="2" style={{fontSize:"18px", textAlign:"left", color:"#849FB4"}}>{Locales.good.收貨結果}</td>
        </tr>
        <tr>
          <td style={{fontSize:"3vw", textAlign:"center", width:"80%"}}>{validCount+invalidCount}</td>
          <td style={{fontSize:"14px", textAlign:"left",paddingTop:"20px"}}>{Locales.common.筆}</td>
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

function InfoList(props) { //收貨列表
  const {goodsLists, searchfilter, expandRowId, onExpand,doSortField, showLastIndex } = props;
  let columns = [{
    dataField: 'vendor',
    text: Locales.good.廠商名稱,
    headerStyle: { width: '17%' },
    sort: true,
    /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
    formatter: (cell, row, rowIndex, colIndex) => {
      if (row.vendorName) {
        return <span>{row.vendorName}<br/>({row.vendorNo})</span>;
      }
    }
  },{
    dataField: 'store',
    text: Locales.good.門市,
    headerStyle: { width: '10%' },
    searchable: false,
    sort: true,
    /*onSort: (field, order) => {
        doSortField(field,order);
      }*/
  },{
    dataField: 'itemName',
    text: Locales.good.品名,
    headerStyle: { width: '16%' },
    searchable: false,
    sort: true,
    /*onSort: (field, order) => {
        doSortField(field,order);
      }*/
  },{
    dataField: 'temperature',
    text: Locales.good.品溫,
    headerStyle: { width: '13%' },
    searchable: false,
    sort: true,
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
    dataField: 'cartemp',
    text: Locales.good.車溫,
    headerStyle: { width: '13%' },
    searchable: false,
    sort: true,
    /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
    formatter: (cell, row, rowIndex, colIndex) => {
      return row.cartemp+ '°C'
    }
  },{
    dataField: 'carResult',
    text: Locales.good.運輸車清潔狀況,
    headerStyle: { width: '10%' },
    searchable: false,
    sort: true,
    /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
    formatter: (cell, row, rowIndex, colIndex) => {
      //console.log("row.result:",row.result);
      if (row.isHighlight) {
        return (
            <span style={ { color: '#FF8373' } }>
              {row.carResult}
            </span>
          );
      }
      return (
          <span style={ { color: '#3D3D3B' } }>{row.carResult}</span>
        );
    }
  },{
    dataField: 'measuringTime',
    text: Locales.good.測溫時間,
    headerStyle: { width: '10%' },
    searchable: false,
    sort: true,
    /*onSort: (field, order) => {
        doSortField(field,order);
      },*/
    formatter: (cell, row, rowIndex, colIndex) => {
        if (row.measuringTime) {
          return (
            <Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.measuringTime}`}</Moment>);
        }
      }
  },{
    dataField: 'result',
    text: Locales.good.收貨結果,
    headerStyle: { width: '10%' },
    searchable: false,
    sort: true,
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
  let expandRow = {
    renderer: row => (
      <table className="SelectInfo abnormalBody" onClick={props.stopClick}>
      <tbody>
      <tr id={row.id} onClick={(e, id) => onExpand(e,id)}>
        <td style={{width:'17%'}}>{row.vendorName}<br />{row.vendorNo}</td>
        <td style={{width:'10%'}}>{row.store}</td>
        <td style={{width:'16%'}}>{row.itemName}</td>
        <td style={{color: row.result?'#3D3D3B':'#FF8373',width:'13%'}}>{row.temperature+ '°C'}</td>
        <td style={{width:'13%'}}>{row.cartemp+ '°C'}</td>
        <td style={{width:'10%'}}>{row.carResult}</td>
        <td style={{width:'10%'}}>
        <Moment style={{whiteSpace: "pre"}} format={"HH:mm[\n]YYYY/MM/DD"}>{`${row.measuringTime}`}</Moment></td>
        <td style={{color:row.result?'#3D3D3B':'#FF8373',width:'10%'}}>{row.result?Locales.common.合格:Locales.common.不合格}</td>
      </tr>
      <tr>
      <td colSpan="8" style={{textAlign:"left"}}>
      <div style={{display:"inlin-block"}}>
        <img src={props.itemImg[0]} style={{width:"151px", height:"271px", margin:"5px 0 5px 20px", cursor:"pointer",visibility:props.itemImg[0]==""?'hidden':'visible'}} onClick={(e,img)=>props.onShowModal(e,props.itemImg[0])}/>
        <img src={props.itemImg[1]} style={{width:"151px", height:"271px", margin:"5px 0 5px 20px", cursor:"pointer", visibility:props.itemImg[1]==""?'hidden':'visible'}} onClick={(e,img)=>props.onShowModal(e,props.itemImg[1])}/>
        <ReactModal
           isOpen={props.showModal}
           contentLabel="Minimal Modal Example"
           style={modalStyles}
           onRequestClose={props.onCloseModal}
           shouldCloseOnOverlayClick={true}
        >
          <div style={{width:"800px", height:"852px"}}>
            <img src={props.modalImg} style={{width:"624px", height:"832px"}}/>
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

  /*let filteredGoodsLists=[];
  _.map(goodsLists, item => {
    if ((searchfilter.Filter.length==2) || //全選
        (item.result) && hasKey(searchfilter.Filter, 1) || //合格
        (!item.result) && hasKey(searchfilter.Filter, 2) //不合格
    ){
        //item.result = item.result?"合格":"不合格";
        filteredGoodsLists.push(item);
    }
  })*/
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
  for(let i=showLastIndex; i<goodsLists.length;i++){
    hiddenRowKeys.push(goodsLists[i].id);
  }
  const { SearchBar } = Search;
  const defaultSorted = [{
    dataField: 'measuringTime',
    order: 'desc'
  }];
  const searchedField = ["vendor"]
  return (
    <CompSearchedTable
      id="tblGoods"
      keyField='id'
      placeholder={Locales.good.請輸入欲查詢廠商編號或廠商名稱}
      defaultSorted={ defaultSorted }
      data={goodsLists}
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
      data={goodsLists}
      columns={ columns }
      search
      >
    {
      props => (
      <div>
        <SearchBar { ...props.searchProps }
        style={ { width: '330px', margin:"20px 30px 10px 0",float:"right" } }
        placeholder={Locales.good.請輸入欲查詢廠商編號或廠商名稱}/>
      <BootstrapTable
        { ...props.baseProps }
        id="tblGoods"
        keyField='id'
        bordered={ false }
        defaultSorted={defaultSorted}
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

function mapStateToProps({store, token, filtergoods, goodslist}, ownProps) {
    return {store, token, filtergoods, goodslist};
  }

export default connect(mapStateToProps, {setGoodsList,setGoodsFilter})(GoodsSubpage);
