"""Cross-Domain Health Intelligence Engine.

Identifies single-domain drifts (|Z| >= 2.0) and cross-domain coupled patterns (|Z| >= 1.5)
across sleep, cardiovascular, behavioral, environmental, and operational contexts.
Dynamically constructs explainable findings and evidence-based recommendations
adapted to the mission profile (e.g. ISS low-latency vs Mars high-latency).
"""

from datetime import datetime, timedelta
from typing import Any, Optional
from app.models.enums import (
    AssessmentStatus,
    DomainId,
    DomainCategory,
    EvidenceType,
    MissionProfile,
    RecommendationStatus,
    ReassessmentOutcome,
)
from app.models.schemas import (
    DomainSummary,
    Finding,
    FindingEvidence,
    RecommendationItem,
    ReassessmentTracker,
)
from app.models.db_models import AstronautModel, RecommendationModel, MetricRecordModel
from app.intelligence.cadences import DOMAIN_DEFINITIONS
from app.intelligence.drift_detector import DomainEvaluation
from app.intelligence.reassessment_tracker import evaluate_reassessment_outcome
from app.intelligence.baseline_engine import compute_metric_baseline


def build_intelligence_report(
    astronaut: AstronautModel,
    evaluations: dict[DomainId, DomainEvaluation],
    all_records: list[MetricRecordModel],
    db_recommendations: list[RecommendationModel],
) -> tuple[list[DomainSummary], list[Finding], list[RecommendationItem]]:
    """Generates all domain summaries, findings, and recommendations deterministically."""
    findings: list[Finding] = []
    recommendations: list[RecommendationItem] = []
    rec_by_id = {r.id: r for r in db_recommendations}

    # Tracking active findings per domain
    active_finding_count_by_domain: dict[DomainId, int] = {d: 0 for d in DomainId}

    # 1. Single-domain statistical baseline drift findings (|Z| >= 2.0)
    for domain_id, ev in evaluations.items():
        if ev.status == AssessmentStatus.ATTENTION and ev.z_score is not None:
            finding_id = f"FINDING-{domain_id.value.upper()}-BASELINE-DRIFT"
            rec_id = f"REC-{domain_id.value.upper()}-01"
            active_finding_count_by_domain[domain_id] += 1

            direction = "elevation" if ev.z_score > 0 else "reduction"
            title = f"{DOMAIN_DEFINITIONS[domain_id].display_name} Baseline Drift"
            what_changed = (
                f"{ev.headline_metric} shows a statistical {direction} of "
                f"{abs(ev.z_score)} standard deviations from personal 14-day rolling baseline "
                f"(current: {ev.headline_value}, baseline mean: {ev.baseline_mean}, std: {ev.baseline_std})."
            )

            why_it_matters = _get_domain_rationale(domain_id, ev.z_score)

            finding = Finding(
                finding_id=finding_id,
                severity="ATTENTION",
                is_cross_domain=False,
                involved_domains=[domain_id],
                title=title,
                what_changed=what_changed,
                why_it_matters=why_it_matters,
                evidence=FindingEvidence(
                    evidence_type=EvidenceType.STATISTICAL_BASELINE_DRIFT,
                    is_validated_clinical_threshold=False,
                    supporting_metrics={
                        "metric_name": ev.headline_metric,
                        "current_value": ev.headline_value,
                        "baseline_mean": ev.baseline_mean,
                        "baseline_std": ev.baseline_std,
                        "z_score": ev.z_score,
                        "sample_count": ev.valid_sample_count,
                    },
                    reference_source=_get_domain_reference(domain_id),
                ),
            )
            findings.append(finding)

            rec_item = _build_recommendation_item(
                rec_id=rec_id,
                finding_id=finding_id,
                domain_id=domain_id,
                astronaut=astronaut,
                target_metric=ev.headline_metric,
                baseline_mean=ev.baseline_mean,
                baseline_std=ev.baseline_std,
                trigger_value=ev.headline_value,
                db_rec=rec_by_id.get(rec_id),
                all_records=all_records,
            )
            recommendations.append(rec_item)

    # 2. Coupled Cross-Domain Pattern: sleep_circadian + cardiovascular + behavioral_psych
    coupled_domains = [DomainId.SLEEP_CIRCADIAN, DomainId.CARDIOVASCULAR, DomainId.BEHAVIORAL_PSYCH]
    elevated_coupled = [
        d for d in coupled_domains
        if evaluations[d].z_score is not None and abs(evaluations[d].z_score) >= 1.5
    ]

    if len(elevated_coupled) >= 2:
        cross_finding_id = "FINDING-CROSS-CIRCADIAN-AUTONOMIC-FATIGUE"
        cross_rec_id = "REC-CROSS-CIRCADIAN-01"

        for d in elevated_coupled:
            active_finding_count_by_domain[d] += 1

        details = ", ".join(
            f"{d.value} (Z = {evaluations[d].z_score})"
            for d in elevated_coupled
        )
        what_changed = (
            f"Multi-domain statistical baseline drift observed across {len(elevated_coupled)} "
            f"coupled domains: {details}."
        )
        why_it_matters = (
            "Concurrent circadian disruption, elevated resting cardiovascular autonomic strain, "
            "and subjective fatigue significantly compound operational risk, decrease cognitive "
            "reserve, and increase vulnerability to errors during mission-critical tasks."
        )

        supporting_metrics = {
            d.value: {
                "headline_metric": evaluations[d].headline_metric,
                "current_value": evaluations[d].headline_value,
                "z_score": evaluations[d].z_score,
            }
            for d in elevated_coupled
        }

        cross_finding = Finding(
            finding_id=cross_finding_id,
            severity="ATTENTION",
            is_cross_domain=True,
            involved_domains=elevated_coupled,
            title="Cross-Domain Circadian, Cardiovascular & Fatigue Strain",
            what_changed=what_changed,
            why_it_matters=why_it_matters,
            evidence=FindingEvidence(
                evidence_type=EvidenceType.STATISTICAL_BASELINE_DRIFT,
                is_validated_clinical_threshold=False,
                supporting_metrics=supporting_metrics,
                reference_source=(
                    "NASA Human Research Program (HRP) Evidence Book: Risk of Adverse Cognitive and "
                    "Behavioral Conditions and Circadian Desynchronization (NASA-SP-2023-4310)"
                ),
            ),
        )
        findings.append(cross_finding)

        primary_metric = evaluations[DomainId.SLEEP_CIRCADIAN].headline_metric
        primary_ev = evaluations[DomainId.SLEEP_CIRCADIAN]

        cross_rec = _build_cross_recommendation_item(
            rec_id=cross_rec_id,
            finding_id=cross_finding_id,
            involved_domains=elevated_coupled,
            astronaut=astronaut,
            target_metric=primary_metric,
            baseline_mean=primary_ev.baseline_mean,
            baseline_std=primary_ev.baseline_std,
            trigger_value=primary_ev.headline_value,
            db_rec=rec_by_id.get(cross_rec_id),
            all_records=all_records,
        )
        recommendations.append(cross_rec)

    # 3. Include any persistent DB recommendations (e.g. acknowledged or awaiting reassessment)
    added_rec_ids = {r.recommendation_id for r in recommendations}
    for db_rec in db_recommendations:
        if db_rec.id not in added_rec_ids:
            # Compute baseline stats for this target metric
            target_metric_records = [r for r in all_records if r.metric_name == db_rec.target_metric]
            metric_baseline = compute_metric_baseline(target_metric_records)

            tracker = _resolve_reassessment_tracker(
                rec_id=db_rec.id,
                target_metric=db_rec.target_metric,
                astronaut=astronaut,
                baseline_mean=metric_baseline.mean,
                baseline_std=metric_baseline.std_dev,
                trigger_value=db_rec.baseline_at_trigger,
                db_rec=db_rec,
                all_records=all_records,
            )

            rec_item = RecommendationItem(
                recommendation_id=db_rec.id,
                finding_id=db_rec.finding_id,
                action_summary=db_rec.action_summary,
                consultation_guidance=db_rec.consultation_guidance,
                escalate_when=db_rec.escalate_when,
                reassessment=tracker,
            )
            recommendations.append(rec_item)

    # 4. Build DomainSummary objects for all 9 domains
    domain_summaries: list[DomainSummary] = []
    for domain_id, ev in evaluations.items():
        defn = DOMAIN_DEFINITIONS[domain_id]
        summary = DomainSummary(
            domain_id=domain_id,
            domain_category=defn.domain_category,
            display_name=defn.display_name,
            measurement_scope_notice=defn.measurement_scope_notice,
            status=ev.status,
            completeness_pct=ev.completeness_pct,
            last_updated=ev.last_updated,
            headline_metric=None if ev.status == AssessmentStatus.INSUFFICIENT_DATA else ev.headline_metric,
            status_reason=ev.status_reason,
            active_finding_count=active_finding_count_by_domain[domain_id],
        )
        domain_summaries.append(summary)

    return domain_summaries, findings, recommendations


def _get_domain_rationale(domain_id: DomainId, z_score: float) -> str:
    rationales = {
        DomainId.CARDIOVASCULAR: (
            "Elevated resting heart rate and altered autonomic tone in microgravity can indicate "
            "deconditioning, subclinical environmental stress, or autonomic fatigue. "
            "Continuous tracking ensures cardiovascular stability without presupposing pathology."
        ),
        DomainId.SLEEP_CIRCADIAN: (
            "Significant departure in sleep duration or circadian phase impairs neurobehavioral "
            "performance, slows psychomotor reaction speed, and alters immune regulation."
        ),
        DomainId.BEHAVIORAL_PSYCH: (
            "Elevated subjective fatigue or psychological strain during long-duration confinement "
            "correlates with mission stress; tracking trends promotes proactive autonomous countermeasures."
        ),
        DomainId.MUSCULOSKELETAL: (
            "Shift in exercise adherence or perceived exertion impacts musculoskeletal countermeasure efficacy "
            "against microgravity bone and muscle deconditioning."
        ),
        DomainId.ENVIRONMENT_ECLSS: (
            "Environmental telemetry drift directly influences crew comfort and physiological compensation, "
            "requiring validation against life-support subsystem setpoints."
        ),
        DomainId.RADIATION: (
            "Dosimetric dose rate shift reflects ambient space radiation environment changes, necessitating "
            "monitoring of cumulative mission margins."
        ),
        DomainId.IMMUNE_MICROBIO: (
            "Biomarker concentration shifts reflect immune status trends and host-microbe equilibrium."
        ),
        DomainId.SENSORIMOTOR_NEURO: (
            "Vestibular and sensorimotor shifts reflect neurovestibular adaptation or operational strain."
        ),
        DomainId.NUTRITION: (
            "Nutritional intake and hydration shifts impact metabolic balance and energy availability."
        ),
    }
    return rationales.get(
        domain_id, "Statistical baseline drift indicates a physiological or telemetry shift requiring review."
    )


def _get_domain_reference(domain_id: DomainId) -> str:
    references = {
        DomainId.CARDIOVASCULAR: "NASA-STD-3001 Vol 1, Crew Health & Cardiovascular Spaceflight Standards",
        DomainId.SLEEP_CIRCADIAN: "NASA HRP Evidence Book: Risk of Sleep Loss and Circadian Desynchronization",
        DomainId.BEHAVIORAL_PSYCH: "NASA HRP Evidence Book: Risk of Adverse Cognitive and Behavioral Conditions",
        DomainId.MUSCULOSKELETAL: "NASA-STD-3001 Vol 2, Exercise Countermeasure Requirements",
        DomainId.ENVIRONMENT_ECLSS: "NASA-STD-3001 Vol 2, Atmospheric Quality and Habitability Specifications",
        DomainId.RADIATION: "NASA-STD-3001 Vol 1, Section 4.3 Radiation Exposure Limits",
        DomainId.IMMUNE_MICROBIO: "NASA HRP Evidence Book: Risk of Crew Adverse Health Event Due to Altered Immune Response",
        DomainId.SENSORIMOTOR_NEURO: "NASA HRP Evidence Book: Risk of Sensorimotor Alterations Affecting Performance",
        DomainId.NUTRITION: "NASA-STD-3001 Vol 2, Nutritional and Metabolic Requirements",
    }
    return references.get(domain_id, "NASA Human Research Program (HRP) Standards Repository")


def _build_recommendation_item(
    rec_id: str,
    finding_id: str,
    domain_id: DomainId,
    astronaut: AstronautModel,
    target_metric: str,
    baseline_mean: float,
    baseline_std: float,
    trigger_value: Optional[float],
    db_rec: Optional[RecommendationModel],
    all_records: list[MetricRecordModel],
) -> RecommendationItem:
    action_summaries = {
        DomainId.CARDIOVASCULAR: "Initiate guided 15-minute autonomic down-regulation breathing protocol; hydrate with 500 mL electrolyte solution and log next rest cycle.",
        DomainId.SLEEP_CIRCADIAN: "Enforce scheduled 8-hour sleep block, advance cabin evening dynamic lighting dimming by 30 minutes, and restrict blue-light screen exposure prior to sleep.",
        DomainId.BEHAVIORAL_PSYCH: "Schedule autonomous low-cognitive-load downtime; conduct self-guided operational resilience check-in.",
        DomainId.MUSCULOSKELETAL: "Review scheduled countermeasure session on ARED/T2; adjust resistance loading based on soreness checklist.",
        DomainId.ENVIRONMENT_ECLSS: "Inspect cabin air circulation ducts; verify primary and secondary trace contaminant scrubbers.",
        DomainId.RADIATION: "Log personal dosimeter status; verify passive storm-shelter equipment readiness.",
    }
    action_summary = action_summaries.get(
        domain_id, "Review current domain telemetry, log observational notes, and follow scheduled operational protocol."
    )

    if astronaut.mission_profile == "MARS_TRANSIT" and not astronaut.live_flight_surgeon_available:
        consultation_guidance = (
            f"Autonomous Spacecraft Operation (Mars Transit): One-way signal delay is "
            f"{astronaut.one_way_light_time_sec}s. Execute autonomous crew countermeasures. "
            f"Queue diagnostic telemetry packet for asynchronous medical ground downlink."
        )
    else:
        consultation_guidance = (
            "Ground-Monitored Operation (ISS LEO): Real-time flight surgeon consultation available. "
            "Report finding during next scheduled daily planning conference (DPC)."
        )

    escalate_when = (
        f"Escalate if {target_metric} statistical drift exceeds 3.0 standard deviations over consecutive "
        f"monitoring windows or if accompanied by acute operational impairment."
    )

    reassessment_tracker = _resolve_reassessment_tracker(
        rec_id=rec_id,
        target_metric=target_metric,
        astronaut=astronaut,
        baseline_mean=baseline_mean,
        baseline_std=baseline_std,
        trigger_value=trigger_value,
        db_rec=db_rec,
        all_records=all_records,
    )

    return RecommendationItem(
        recommendation_id=rec_id,
        finding_id=finding_id,
        action_summary=action_summary,
        consultation_guidance=consultation_guidance,
        escalate_when=escalate_when,
        reassessment=reassessment_tracker,
    )


def _build_cross_recommendation_item(
    rec_id: str,
    finding_id: str,
    involved_domains: list[DomainId],
    astronaut: AstronautModel,
    target_metric: str,
    baseline_mean: float,
    baseline_std: float,
    trigger_value: Optional[float],
    db_rec: Optional[RecommendationModel],
    all_records: list[MetricRecordModel],
) -> RecommendationItem:
    action_summary = (
        "Multi-domain intervention: Prioritize uninterrupted sleep opportunity (>= 8 hours); "
        "defer high-demand EVA or critical manual teleoperation tasks until follow-up rest evaluation."
    )

    if astronaut.mission_profile == "MARS_TRANSIT" and not astronaut.live_flight_surgeon_available:
        consultation_guidance = (
            f"High-Latency Mars Transit: Signal delay {astronaut.one_way_light_time_sec}s. "
            "Commander and Medical Officer autonomy authorized. Implement rest protocol and packet downlink."
        )
    else:
        consultation_guidance = (
            "ISS Low Earth Orbit: Tag flight surgeon console for multidisciplinary review at upcoming DPC."
        )

    escalate_when = (
        "Escalate immediately if cognitive fatigue impairs emergency drill response or if resting HR continues to rise."
    )

    reassessment_tracker = _resolve_reassessment_tracker(
        rec_id=rec_id,
        target_metric=target_metric,
        astronaut=astronaut,
        baseline_mean=baseline_mean,
        baseline_std=baseline_std,
        trigger_value=trigger_value,
        db_rec=db_rec,
        all_records=all_records,
    )

    return RecommendationItem(
        recommendation_id=rec_id,
        finding_id=finding_id,
        action_summary=action_summary,
        consultation_guidance=consultation_guidance,
        escalate_when=escalate_when,
        reassessment=reassessment_tracker,
    )


def _resolve_reassessment_tracker(
    rec_id: str,
    target_metric: str,
    astronaut: AstronautModel,
    baseline_mean: float,
    baseline_std: float,
    trigger_value: Optional[float],
    db_rec: Optional[RecommendationModel],
    all_records: list[MetricRecordModel],
) -> ReassessmentTracker:
    """Synchronizes recommendation state with database model if present; evaluates outcome."""
    if db_rec is not None:
        outcome = evaluate_reassessment_outcome(
            rec=db_rec,
            reference_timestamp=astronaut.reference_timestamp,
            metric_records=all_records,
            baseline_mean=baseline_mean,
            baseline_std=baseline_std,
        )
        db_rec.outcome = outcome.value

        status = RecommendationStatus(db_rec.status)
        return ReassessmentTracker(
            status=status,
            acknowledged_at=db_rec.acknowledged_at,
            action_taken_note=db_rec.action_taken_note,
            reassess_after=db_rec.reassess_after,
            target_metric=target_metric,
            baseline_at_trigger=db_rec.baseline_at_trigger,
            latest_followup_value=db_rec.latest_followup_value,
            outcome=outcome,
        )

    # Initial active recommendation
    return ReassessmentTracker(
        status=RecommendationStatus.ACTIVE,
        acknowledged_at=None,
        action_taken_note=None,
        reassess_after=astronaut.reference_timestamp + timedelta(hours=24),
        target_metric=target_metric,
        baseline_at_trigger=trigger_value,
        latest_followup_value=None,
        outcome=ReassessmentOutcome.PENDING,
    )
