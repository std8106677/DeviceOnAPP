import _ from "lodash";
import { SET_STOREREGION } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_STOREREGION:
      return action.payload;
    default:
      return state;
  }
}
