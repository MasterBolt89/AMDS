"""SQLAlchemy ORM Models for Astronaut Health Monitoring & Intelligence Engine."""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AstronautModel(Base):
    __tablename__ = "astronauts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    callsign: Mapped[str] = mapped_column(String(64), nullable=False)
    role: Mapped[str] = mapped_column(String(128), nullable=False)
    mission_day: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    mission_profile: Mapped[str] = mapped_column(String(64), nullable=False, default="ISS_LEO")
    one_way_light_time_sec: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    live_flight_surgeon_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    support_mode: Mapped[str] = mapped_column(String(128), nullable=False, default="GROUND_MONITORED")
    available_onboard_equipment: Mapped[str] = mapped_column(
        Text, nullable=False, default='["ARED", "T2", "CEVIS", "MED_KIT"]'
    )
    reference_timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    active_provenance: Mapped[str] = mapped_column(String(32), nullable=False, default="SIMULATED")
    scenario_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    metric_records: Mapped[list["MetricRecordModel"]] = relationship(
        "MetricRecordModel", back_populates="astronaut", cascade="all, delete-orphan"
    )
    operational_risks: Mapped[list["OperationalRiskRecordModel"]] = relationship(
        "OperationalRiskRecordModel", back_populates="astronaut", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["RecommendationModel"]] = relationship(
        "RecommendationModel", back_populates="astronaut", cascade="all, delete-orphan"
    )


class MetricRecordModel(Base):
    __tablename__ = "metric_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    astronaut_id: Mapped[str] = mapped_column(String(64), ForeignKey("astronauts.id"), index=True, nullable=False)
    domain_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    metric_name: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Null for MISSING
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    quality: Mapped[str] = mapped_column(String(32), nullable=False, default="VALID")  # VALID, SUSPECT, MISSING
    provenance: Mapped[str] = mapped_column(String(32), nullable=False, default="SIMULATED")
    modality: Mapped[str] = mapped_column(String(32), nullable=False, default="OBJECTIVE_SENSOR")
    sensor_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    astronaut: Mapped["AstronautModel"] = relationship("AstronautModel", back_populates="metric_records")


class OperationalRiskRecordModel(Base):
    __tablename__ = "operational_risk_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    astronaut_id: Mapped[str] = mapped_column(String(64), ForeignKey("astronauts.id"), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    mitigation_applied: Mapped[str] = mapped_column(Text, nullable=False)
    downlink_priority: Mapped[str] = mapped_column(String(32), nullable=False, default="ROUTINE")

    astronaut: Mapped["AstronautModel"] = relationship("AstronautModel", back_populates="operational_risks")


class RecommendationModel(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    finding_id: Mapped[str] = mapped_column(String(64), nullable=False)
    astronaut_id: Mapped[str] = mapped_column(String(64), ForeignKey("astronauts.id"), index=True, nullable=False)
    action_summary: Mapped[str] = mapped_column(Text, nullable=False)
    consultation_guidance: Mapped[str] = mapped_column(Text, nullable=False)
    escalate_when: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    target_metric: Mapped[str] = mapped_column(String(64), nullable=False)
    reassess_after_hours: Mapped[float] = mapped_column(Float, nullable=False, default=24.0)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    action_taken_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reassess_after: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    baseline_at_trigger: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latest_followup_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")

    astronaut: Mapped["AstronautModel"] = relationship("AstronautModel", back_populates="recommendations")


class AssessmentHistoryModel(Base):
    __tablename__ = "assessment_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    astronaut_id: Mapped[str] = mapped_column(String(64), ForeignKey("astronauts.id"), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    domain_id: Mapped[str] = mapped_column(String(64), nullable=False)
    previous_status: Mapped[str] = mapped_column(String(32), nullable=False)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

