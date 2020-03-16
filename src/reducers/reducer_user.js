import _ from "lodash";
import { SET_USER } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_USER:
      return action.payload;
    default:
      return state;
  }
}
