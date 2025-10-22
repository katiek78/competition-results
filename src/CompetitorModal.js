import React from "react";
import { Modal } from "react-bootstrap";
import { getFlagEmoji } from "./utils";

const CompetitorModal = ({ show, onHide, competitor }) => {
  if (!competitor) return null;
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Competitor Info</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: "center", fontSize: "1.5em" }}>
        <div style={{ marginBottom: "1em" }}>
          <strong>
            {competitor.firstName} {competitor.lastName}
          </strong>
        </div>
        {competitor.country && competitor.country !== "(none)" && (
          <div style={{ fontSize: "2em" }}>
            {getFlagEmoji(competitor.country)}
          </div>
        )}
        {competitor.country === "(none)" && (
          <div style={{ color: "#888", fontStyle: "italic" }}>
            (no affiliation)
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CompetitorModal;
