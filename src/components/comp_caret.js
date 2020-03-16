import React, { Component } from "react";

export function CaretUpComp() {
  return (
    <span style={{
      borderWidth: "5px 5px 2.5px",
      borderStyle: "solid",
      borderColor: "#0F0F0F transparent transparent",
      position: "absolute",
      margin: "10px 0 0 5px"
    }}/>
  );
}

export function CaretDownComp() {
  return (
    <span style={{
      borderWidth: "5px 5px 5px",
      borderStyle: "solid",
      borderColor: "transparent transparent #0F0F0F",
      position: "absolute",
      margin: "5px 0 0 5px"
    }}/>
  );
}

export function CaretComp() {
  return (
    <span>
      <span style={{
        borderWidth: "5px 5px 2.5px",
        borderStyle: "solid",
        borderColor: "#CCC transparent transparent",
        position: "absolute",
        margin: "10px 0 0 5px"
      }}/>
      <span style={{
        borderWidth: "5px 5px 5px",
        borderStyle: "solid",
        borderColor: "transparent transparent #CCC",
        position: "absolute",
        margin: "5px 0 0 15px"
      }}/>
    </span>
  );
}
