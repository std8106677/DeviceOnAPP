import _ from "lodash";
import { SET_LANGUAGE } from "../actions";

export default function(state = 'cht', action) {
  switch (action.type) {
    case SET_LANGUAGE:
      return action.payload;
    default:
      return state;
  }
}
