import axios from "axios";

export const SET_USER = "setUser";
export const SET_PAGE = "setPage";
export const SET_PAGEBACKEND = "setPageBackend";
export const SET_STORE = "setStore";
export const SET_STORETYPE = "setStoreType";
export const SET_STOREREGION = "setStoreRegion";
export const SET_STOREDEPARTMENT = "setStoreDepartment";
export const SET_POSITION = "setPosition";
export const SET_SENSOR = "setSensor";
export const SET_TEMP = "setTemp";
export const SET_ABNORMALLIST = "setAbnormalList";
export const SET_WATCHLIST= "setWatchList";
export const SET_GOODSLIST= "setGoodsList";
export const SET_TRANSPORTLIST= "setTransportList";
export const SET_SEARCHFILTER = {TO:'DATE_TO' ,FROM:'DATE_FROM', FILTER:'result'};
export const SET_LANGUAGE = "setLanguage";
export const SET_CORRECTION = "setCorrection";
export const SET_TOKEN = "setToken";
export const SET_TRANSPORTFILTER = "setTransportFilter";
export const SET_ABNORMALFILTER = "setAbnormalFilter";
export const SET_GOODSFILTER= "setGoodsFilter";
export const SET_WATCHFILTER = "setWatchFilter";
export const SET_UPDATEDATA = "setUpdateData";

export function setUser(user) {
  return {
    type: SET_USER,
    payload: user
  };
}

export function setPage(page) {
  return {
    type: SET_PAGE,
    payload: page
  };
}

export function setPageBackend(page) {
  return {
    type: SET_PAGEBACKEND,
    payload: page
  };
}

export function setStore(store) {
  return {
    type: SET_STORE,
    payload: store
  };
}

export function setStoreType(storeType) {
  return {
    type: SET_STORETYPE,
    payload: storeType
  };
}

export function setStoreRegion(storeRegion) {
  return {
    type: SET_STOREREGION,
    payload: storeRegion
  };
}

export function setStoreDepartment(storeDepartment) {
  return {
    type: SET_STOREDEPARTMENT,
    payload: storeDepartment
  };
}

export function setPosition(position) {
  return {
    type: SET_POSITION,
    payload: position
  };
}

export function setSensor(sensor) {
  return {
    type: SET_SENSOR,
    payload: sensor
  };
}

export function setTemp(temp) {
  return {
    type: SET_TEMP,
    payload: temp
  };
}

export function setAbnormalList(list) {
  return {
    type: SET_ABNORMALLIST,
    payload: list
  };
}

export function setSearchFilter(filter) {
  //console.log("action:"+filter);
  return {
    type: SET_SEARCHFILTER,
    payload: filter
  };
}

export function setLanguage(lan) {
  return {
    type: SET_LANGUAGE,
    payload: lan
  };
}

export function setCorrection(correction) {
  console.log("setCorrection");
  return {
    type: SET_CORRECTION,
    payload: correction
  };
}

export function setWatchList(list){
  return {
    type: SET_WATCHLIST,
    payload: list
  };
}

export function setGoodsList(list){

  return {
    type: SET_GOODSLIST,
    payload: list
  };
}

export function setTransportList(list){
  return {
    type: SET_TRANSPORTLIST,
    payload: list
  };
}

export function setToken(token){
  return {
    type: SET_TOKEN,
    payload: token
  };
}

export function setTransportFilter(filter){
  return {
    type: SET_TRANSPORTFILTER,
    payload: filter
  };
}

export function setAbnormalFilter(filter){
  return {
    type: SET_ABNORMALFILTER,
    payload: filter
  };
}

export function setGoodsFilter(filter){
  return {
    type: SET_GOODSFILTER,
    payload: filter
  };
}

export function setWatchFilter(filter){
  return {
    type: SET_WATCHFILTER,
    payload: filter
  };
}

export function setUpdateData(filter){
  return {
    type: SET_UPDATEDATA,
    payload: filter
  };
}
