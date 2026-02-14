export interface AirtableAttachment {
    id: string;
    url: string;
    filename: string;
}

export interface PatientRecord {
    id: string;
    fields: {
        respondent_id?: string;
        language?: string;
        // Master Fields (Formulas)
        q1_primary_goal_MASTER?: string;
        q1_goal_secondary_MASTER?: string;
        q2_risk_flags_MASTER?: string;
        d_age_MASTER?: string;
        d_gender_MASTER?: string;
        q_treatment_locations?: string[]; // Array of strings (e.g., "Forehead", "Cheek")

        // Raw Fields (for fallback/coalescing)
        q6_pain_tolerance_EN?: string;
        q6_pain_tolerance_KO?: string;
        q6_pain_tolerance_JP?: string;
        q6_pain_tolerance_CN?: string;

        q6_down_time_EN?: string;
        q6_down_time_KO?: string;
        q6_down_time_JP?: string;
        q6_down_time_CN?: string;

        q4_skin_thickness_EN?: string;
        q4_skin_thickness_KO?: string;
        q4_skin_thickness_JP?: string;
        q4_skin_thickness_CN?: string;
    };
}

export interface ProtocolRecord {
    id: string;
    fields: {
        protocol_id?: string;
        protocol_name?: string;
        goal_primary?: string; // Single Select
        goal_additional?: string[]; // Multiple Select
        pain_level?: string; // "Low", "Medium", "High", "Very High"
        downtime_level?: string; // "None", "Low", "Medium", "High"
        indications?: string[]; // Link to Indication Map
        "indication_name (from indications)"?: string[];
        device_ids?: string[];
        "device_name (from device_ids)"?: string[];
        "booster_name (from skin_booster_ids)"?: string[];
        notes?: string;

        // New Fields for Report Engine
        mechanism_action?: string;
        target_layer?: string[];
        device_name_primary?: string[];
        indication_secondary?: string[];
        device_names?: string[];
    };
}

export interface IndicationRecord {
    id: string;
    fields: {
        indication_name?: string;
        concern_domain?: string;
        recommended_device_categories?: string | string[]; // Can be text or array depending on mapping
        Protocol_block?: string[]; // Linked protocols
    };
}

export interface DoctorSolutionRecord {
    id: string;
    fields: {
        doctor_name?: string;
        solution_name?: string;
        clinic_name?: string;
        Protocols?: string[]; // Linked Protocol Block
        is_signiture_solution?: boolean;
        patient_segment?: string;
    };
}
