namespace P7VC {
  entity User in [Role] {
    role: String,
    teamId: String,
  };
  entity Role;
  entity Company {
    dealStage: String,
    p7vcDealLead: String,
    dealLeadSupport1: String,
    dealLeadSupport2: String,
  };
  entity Contact {
    piiClassification: String,
  };
  entity Activity;
  entity Document {
    piiClassification: String,
  };
  entity AuditLog {
    immutable: Bool,
  };
  entity Action;

  action create appliesTo {
    principal: User,
    resource: [Company, Contact, Activity, Document, AuditLog]
  };
  action read appliesTo {
    principal: User,
    resource: [Company, Contact, Activity, Document, AuditLog]
  };
  action update appliesTo {
    principal: User,
    resource: [Company, Contact, Activity, Document]
  };
  action delete appliesTo {
    principal: User,
    resource: [Company, Contact, Activity, Document]
  };
  action reassign appliesTo {
    principal: User,
    resource: Company
  };
  action update_ownership_fields appliesTo {
    principal: User,
    resource: Company
  };
}
