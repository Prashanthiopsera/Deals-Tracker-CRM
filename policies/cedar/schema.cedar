namespace P7VC {
  entity User in [Role];
  entity Role;
  entity Company;
  entity Action;

  action create appliesTo {
    principal: User,
    resource: Company
  };
  action read appliesTo {
    principal: User,
    resource: Company
  };
  action update appliesTo {
    principal: User,
    resource: Company
  };
  action delete appliesTo {
    principal: User,
    resource: Company
  };
  action reassign appliesTo {
    principal: User,
    resource: Company
  };
  action update_ownership_field appliesTo {
    principal: User,
    resource: Company
  };
}
