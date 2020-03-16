import _ from "lodash";
import { SET_STORETYPE } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_STORETYPE:
      return action.payload;
    default:
      return state;
  }
}
