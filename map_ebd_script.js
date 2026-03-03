const processCategories = () => {
    try {
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('./.agent/ebd_categories.json', 'utf8'));
        
        // Rule generation based on the provided clinical document conditions and general dermatological knowledge
        const results = data.map(cat => {
          let primary = [];
          let secondary = [];
          let risk_trigger = [];
          let area_trigger = [];
          
          // Evaluate mapped goals based on category logic
          switch(cat.category_id) {
            case "ERYAG":
              primary = ["Texture refinement", "Acne/Scar improvement"];
              secondary = ["Pore & Skin quality"];
              break;
            case "MN_RF":
              primary = ["Acne/Scar improvement", "Pore & Skin quality", "Texture refinement"];
              secondary = ["Brightening/radiance", "Jawline/Contour definition"];
              risk_trigger = ["Active Acne", "Acne/post-inflammatory"]; // SPECIAL HARDCODED RULE 4-2
              area_trigger = ["Pores/texture"]; // SPECIAL HARDCODED RULE 1
              break;
            case "FRAC_1550":
              primary = ["Texture refinement", "Pore & Skin quality", "Acne/Scar improvement"];
              secondary = ["Hydration/Regeneration"];
              break;
            case "PICO":
              primary = ["Brightening/radiance"];
              secondary = ["Texture refinement"];
              risk_trigger = ["Melasma/pigmentation risk"]; 
              break;
            case "FRAC_1927":
              primary = ["Texture refinement", "Brightening/radiance"];
              secondary = ["Pore & Skin quality", "Hydration/Regeneration"];
              break;
            case "IPL":
              primary = ["Brightening/radiance"];
              secondary = ["Texture refinement"];
              risk_trigger = ["Rosacea/vascular"];
              break;
            case "CO2":
              primary = ["Acne/Scar improvement", "Texture refinement"];
              secondary = ["Pore & Skin quality"];
              break;
            case "LP_532_1064":
              primary = ["Brightening/radiance"];
              secondary = ["Texture refinement"];
              risk_trigger = ["Rosacea/vascular"];
              break;
            case "HIFU":
              primary = ["Contouring/lifting", "Jawline/Contour definition"];
              secondary = ["Eye area/Fine lines"];
              area_trigger = ["Jawline/lower face", "Midface volume"];
              break;
            case "Diode laser":
              primary = [];
              secondary = ["Texture refinement"];
              break;
            case "PDL":
              primary = ["Brightening/radiance"];
              secondary = [];
              risk_trigger = ["Rosacea/vascular"];
              break;
            case "SKIN_BOOSTER":
              primary = ["Hydration/Regeneration", "Texture refinement"];
              secondary = ["Brightening/radiance"];
              break;
            case "LED":
              primary = [];
              secondary = ["Hydration/Regeneration"];
              break;
            case "BODY_CONTOUR":
              primary = ["Body contouring"];
              secondary = ["Jawline/Contour definition"];
              break;
            case "BI_MULTI_RF":
              primary = ["Jawline/Contour definition", "Body contouring"];
              secondary = ["Contouring/lifting"];
              area_trigger = ["Jawline/lower face"];
              break;
            case "MONO_RF":
              primary = ["Contouring/lifting", "Texture refinement"];
              secondary = ["Jawline/Contour definition"];
              area_trigger = ["Midface volume", "Eye area"];
              break;
            case "Q_SWITCH":
              primary = ["Brightening/radiance"];
              secondary = ["Texture refinement"];
              risk_trigger = ["Melasma/pigmentation risk"]; // Q_SWITCH Reepot rule handling applies in match.ts, but standard trigger applies here
              break;
            case "LP_755_1064":
              primary = ["Brightening/radiance"];
              secondary = ["Texture refinement"];
              risk_trigger = ["Rosacea/vascular"];
              break;
            case "HIFES":
              primary = ["Contouring/lifting"];
              secondary = ["Jawline/Contour definition"];
              area_trigger = ["Midface volume"];
              break;
            default:
              console.warn("Unmapped category: ", cat.category_id);
          }
          
          return {
            category_id: cat.category_id,
            survey_primary_match: primary.join(", "),
            survey_secondary_match: secondary.join(", "),
            risk_flag_trigger: risk_trigger.join(", "),
            concern_area_trigger: area_trigger.join(", ")
          };
        });
        
        fs.writeFileSync('./.agent/ebd_mapped.json', JSON.stringify(results, null, 2));
        console.log("Mapping logic applied and saved to .agent/ebd_mapped.json");
    } catch (e) {
        console.error(e)
    }
}

processCategories();
