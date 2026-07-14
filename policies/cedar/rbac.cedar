@id("default-deny")
forbid (
  principal,
  action,
  resource
);

@id("director-full-access")
permit (
  principal in P7VC::Role::"Director",
  action,
  resource
);

@id("admin-full-access")
permit (
  principal in P7VC::Role::"Admin",
  action,
  resource
);

@id("principal-no-delete")
permit (
  principal in P7VC::Role::"Principal",
  action,
  resource
) when {
  action != P7VC::Action::"delete"
};

@id("associate-limited")
permit (
  principal in P7VC::Role::"Associate",
  action,
  resource
) when {
  action in [
    P7VC::Action::"create",
    P7VC::Action::"read",
    P7VC::Action::"update"
  ]
};

@id("intern-read-update")
permit (
  principal in P7VC::Role::"Intern",
  action,
  resource
) when {
  action in [P7VC::Action::"read", P7VC::Action::"update"]
};

@id("intern-deny-ownership")
forbid (
  principal in P7VC::Role::"Intern",
  action == P7VC::Action::"update_ownership_fields",
  resource is P7VC::Company
);

@id("intern-deny-create-delete-reassign")
forbid (
  principal in P7VC::Role::"Intern",
  action in [
    P7VC::Action::"create",
    P7VC::Action::"delete",
    P7VC::Action::"reassign"
  ],
  resource
);

@id("associate-deny-reassign-delete-ownership")
forbid (
  principal in P7VC::Role::"Associate",
  action in [
    P7VC::Action::"reassign",
    P7VC::Action::"delete",
    P7VC::Action::"update_ownership_fields"
  ],
  resource
);
