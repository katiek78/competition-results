import React from "react";
import { Modal, Table } from "react-bootstrap";
import { getFlagEmoji } from "./utils";

const CompetitorModal = ({
  show,
  onHide,
  competitor,
  results,
  disciplines,
  getDisciplineNameFromRef,
}) => {
  if (!competitor) return null;

  // Filter results for this competitor
  const competitorResults = (results || []).filter(
    (r) => r.compUser === competitor._id
  );

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Competitor Info</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: "center", fontSize: "1.1em" }}>
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

        <div style={{ marginTop: "1.5em" }}>
          <h5>Results in this competition</h5>
          {competitorResults.length === 0 ? (
            <div style={{ color: "#888" }}>(No results yet)</div>
          ) : (
            <Table size="sm" bordered hover style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Discipline</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {disciplines &&
                  disciplines.map((discipline) => {
                    const res = competitorResults.find(
                      (r) => r.discipline === discipline
                    );
                    if (!res) return null;
                    return (
                      <tr key={discipline}>
                        <td>
                          {getDisciplineNameFromRef
                            ? getDisciplineNameFromRef(discipline)
                            : discipline}
                        </td>
                        <td>
                          {res.rawScore}
                          {res.time !== undefined &&
                            res.time !== 0 &&
                            ` (${res.time})`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CompetitorModal;
