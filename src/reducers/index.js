import { combineReducers } from "redux";
import { reducer as formReducer } from "redux-form";
import UserReducer from "./reducer_user";
import PageReducer from "./reducer_page";
import StoreReducer from "./reducer_store";
import StoreTypeReducer from "./reducer_storeType";
import StoreRegionReducer from "./reducer_storeRegion";
import StoreDepartmentReducer from "./reducer_storeDepartment";
import PositionReducer from "./reducer_position";
import SensorReducer from "./reducer_sensor";
import TempReducer from "./reducer_temp";
import AbnormallistReducer from "./reducer_Abnormallist";
import WatchlistReducer from "./reducer_watch";
import GoodslistReducer from "./reducer_goods"
import TransportlistReducer from "./reducer_transport"
import CorrectionReducer from "./reducer_correction";
import SearchFilterReducer from "./reducer_SearchFilter";
import LanguageReducer from "./reducer_language";
import TokenReducer from "./reducer_token";

import PageReducer_Backend from "./reducer_page_backend";
import FilterTranspotReducer from "./reducer_filterTransport"
import FilterAbnormalReducer from "./reducer_filterAbnormal"
import FilterGoodsReducer from "./reducer_filterGoods"
import FilterWatchReducer from "./reducer_filterWatch"
import UpdateDataReducer from "./reducer_updateData"

const rootReducer = combineReducers({
  page: PageReducer,
  token: TokenReducer,
  language: LanguageReducer,
  user: UserReducer,
  store: StoreReducer,
  storeType: StoreTypeReducer,
  storeRegion: StoreRegionReducer,
  storeDepartment: StoreDepartmentReducer,
  position: PositionReducer,
  sensor: SensorReducer,
  temp: TempReducer,
  abnormallist: AbnormallistReducer,
  searchfilter: SearchFilterReducer,
  form: formReducer,
  watchlist: WatchlistReducer,
  correction: CorrectionReducer,
  goodslist: GoodslistReducer,
  transportlist: TransportlistReducer,

  page_backend: PageReducer_Backend,
  filtertransport: FilterTranspotReducer,
  filterabnoraml: FilterAbnormalReducer,
  filtergoods: FilterGoodsReducer,
  filterwatch: FilterWatchReducer,
  updateData: UpdateDataReducer,
});

export default rootReducer;
