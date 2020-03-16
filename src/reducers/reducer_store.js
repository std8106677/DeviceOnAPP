import _ from "lodash";
import { SET_STORE } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_STORE:
      return action.payload;
    default:
      return state;
  }
}
