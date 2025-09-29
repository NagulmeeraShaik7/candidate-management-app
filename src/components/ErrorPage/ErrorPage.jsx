import React from "react";
import "./ErrorPage.css";

const errorDetails = {
  400: {
    title: "400",
    message: "Bad Request. Please check your input or try again.",
    color: "#ef4444"
  },
  404: {
    title: "404",
    message: "Sorry, the page or resource was not found.",
    color: "#f59e42"
  },
  403: {
    title: "403",
    message: "Forbidden. You don't have permission to access this resource.",
    color: "#f59e42"
  },
  401: {
    title: "401",
    message: "Unauthorized. Please log in to access this resource.",
    color: "#f59e42"
  },
  500: {
    title: "500",
    message: "Internal Server Error. Please try again later.",
    color: "#0ea5e9"
  }
};

const ErrorPage = ({ code = 404 }) => {
  const { title, message, color } = errorDetails[code] || errorDetails[404];
  return (
    <div className="error-page">
      <i className="bi bi-emoji-frown error-icon"></i>
      <h1 style={{ color }}>{title}</h1>
      <p>{message}</p>
      <a href="/" className="back-btn">Go Home</a>
    </div>
  );
};

export default ErrorPage;