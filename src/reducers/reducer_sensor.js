import _ from "lodash";
import { SET_SENSOR, SET_ABNORMALSENSOR } from "../actions";

export default function(state = {}, action) {
  //console.log(action.type);
  switch (action.type) {
    case SET_SENSOR:
      return action.payload;
    default:
      return state;
  }
}
