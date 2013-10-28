coverage_url = "https://gds.eligibleapi.com/v1.1/coverage/all.json"

showForm = function() {
  $(".test-param").hide();
  $(".real-param").show();
}

showTest = function() {
  $(".real-param").hide();
  $(".test-param").show();
}

errorCallback = function(xhr, textStatus, errorThrown) {
  window.alert("Error on request: " + errorThrown);
}

successCallback = function(data) {
  $(".has-error").removeClass("has-error");

  $(".eligible-plugin-coverage-template").remove();
  if (data.error) {
    buildError(data.error);
  } else {
    buildCoverageHTML(data);
  }

  //$("#benefits_accordion").accordion();
}

objectToUrlParameters = function(obj) {
  var str = "";
  for (var key in obj) {
    if (str != "") {
      str += "&";
    }
    str += key + "=" + encodeURIComponent(obj[key]);
  }
  return str;
};

coverageRequest = function(params) {
  var options;
  var parameters = objectToUrlParameters(params)
  options = {
    data: parameters,
    headers: {
      "User-Agent": "JS Demo",
      Accept: "application/json",
    },
    type: "GET",
    dataType: "json",
    processData: false,
    success: function(data, textStatus, jqXHR) {
      console.log("GET Ajax Call SUCCESS URL:" + coverage_url + "?" + parameters + ", Status :" + textStatus)
      successCallback(data);
    },
    error: function(xhr, textStatus, errorThrown) {
      console.log("GET Ajax Call FAILURE URL:" + coverage_url + "?" + parameters + ", Status :", textStatus, ", Error: ", errorThrown)
      errorCallback(xhr, textStatus, errorThrown);
    }
  };

  $.ajax(coverage_url, options);
}


$(document).ready(function() {
  if ($("input[name=test]:checked").val() == "true") {
    showTest();
  } else {
    showForm();
  }

  $("input[name=test]").on('click', function() {
    if ($(this).val() == 'true') {
      showTest();
    } else {
      showForm();
    }
  });

  $(".form-coverage").on('submit', function(e) {
    e.preventDefault();

    var test = $("input[name=test]:checked").val();

    if (test == "true") {
      fetchTestCoverage();
    } else {
      fetchRealCoverage();
    }
  });
});

fetchRealCoverage = function() {
  var params = {
    api_key: $("#api_key").val(),
    payer_id: $("#payer_id").val(),
    provider_npi: $("#provider_npi").val(),
    provider_last_name: $("#provider_last_name").val(),
    provider_first_name: $("#provider_first_name").val(),
    member_id: $("#member_id").val(),
    member_first_name: $("#member_first_name").val(),
    member_last_name: $("#member_last_name").val(),
    member_dob: $("#member_dob").val()
  };

  $.each(params, function(key) {
    if ((params[key] === undefined) || (params[key].match(/^\s*$/))) {
      $("#" + key).closest('.form-group').addClass('has-error');
    } else {
      $("#" + key).closest('.form-group').removeClass('has-error');
    }
  });

  if ($(".has-error").length > 0) {
    alert("Please fill all the fields");
  } else {
    coverageRequest(params);
  }
}

fetchTestCoverage = function() {
  var params = {
    api_key: $("#api_key").val(),
    test_member_id: $("#test_member_id").val()
  };

  $.each(params, function(key) {
    if ((params[key] === undefined) || (params[key].match(/^\s*$/))) {
      $("#" + key).closest('.form-group').addClass('has-error');
    } else {
      $("#" + key).closest('.form-group').removeClass('has-error');
    }
  });

  if ($(".has-error").length > 0) {
    alert("Please fill all the fields");
  } else {
    params['test'] = 'true';
    params['member_id'] = params['test_member_id'];
    delete params['test_member_id'];
    params['provider_npi'] = params['provider_last_name'] = params['provider_first_name'] =
      params['member_last_name'] = params['member_first_name'] = '1234567890';
    params['payer_id'] = '00001';
    params['member_dob'] = '1981-01-01';

    coverageRequest(params);
  }
}

buildError = function(error) {
  var coverageSection = $("<section/>").addClass("eligible-plugin-coverage-template");

  var ul = $("<ul/>").appendTo(coverageSection);
  $("<li/>", {"text": "Response Code: " + error['response_code']}).appendTo(ul);
  $("<li/>", {"text": "Response Description: " + error['response_description']}).appendTo(ul);
  $("<li/>", {"text": "Agency Qualifier Code: " + error['agency_qualifier_code']}).appendTo(ul);
  $("<li/>", {"text": "Agency Qualifier Description: " + error['agency_qualifier_description']}).appendTo(ul);
  $("<li/>", {"text": "Reject Reason Code: " + error['reject_reason_code']}).appendTo(ul);
  $("<li/>", {"text": "Reject Reason Description: " + error['reject_reason_description']}).appendTo(ul);
  $("<li/>", {"text": "Follow Up Action Code: " + error["follow-up_action_code"]}).appendTo(ul);
  $("<li/>", {"text": "Follow Up Action Description: " + error["follow-up_action_description"]}).appendTo(ul);
  $("<li/>", {"text": "Details: " + error['details']}).appendTo(ul);

  var body = $('body');
  coverageSection.appendTo(body);
}


buildCoverageHTML = function(data) {
  var coverageSection = $("<section/>").addClass("eligible-plugin-coverage-template");

  // Adding Record Scrub and making it default selected element
  var recordScrub = buildCoverageRecordScrub(data.demographics);
  recordScrub.addClass("current");
  recordScrub.appendTo(coverageSection);

  // Adding benefits
  var benefits = buildCoveragePlanBenefits(data);
  benefits.appendTo(coverageSection);

  // Adding Service details
  var services = buildCoverageServices(data.services);
  services.appendTo(coverageSection);

  var body = $('body');
  coverageSection.appendTo(body);
};

buildCoverageServices = function(services) {
  var services = $("<table class=\"table table-bordered\"/>").addClass("content details");

  return services;
};

buildCoverageRecordScrub = function(demographics) {
  var recordScrub = $("<table class=\"table table-bordered\"/>").addClass("content record-scrub");

  return recordScrub;
};

buildCoveragePlanBenefits = function(data) {
  var plan = data.plan;
  var primaryInsurance = data.primary_insurance;

  var benefits = $("<div/>").addClass("content benefits");
  var benefitsTable = $("<table class=\"table table-bordered\"/>").appendTo(benefits);
  var benefitsBody = $("<tbody/>").appendTo(benefitsTable);

  var payerRow = $("<tr/>");
  $("<td/>").text("Payer Name: " + primaryInsurance.name).appendTo(payerRow);
  $("<td/>").text("Payer Type: " + primaryInsurance.type_label).appendTo(payerRow);
  $("<td/>", {"colspan": "2"}).text("Payer Contact: " + parseContacts(primaryInsurance.contacts)).appendTo(payerRow);
  payerRow.appendTo(benefitsBody);

  var planRow = $("<tr/>");
  $("<td/>").text("Coverage Status: " + coverageStatus(plan)).appendTo(planRow);
  $("<td/>").text("Plan Name: " + plan.plan_name).appendTo(planRow);
  $("<td/>").text("Plan Type: " + plan.plan_type_label).appendTo(planRow);
  $("<td/>").text("Group Name: " + plan.group_name).appendTo(planRow);
  planRow.appendTo(benefitsBody);

  var planDetailsRow = $("<tr/>");
  var dates = plan.dates;
  $("<td/>").text("Plan Number: " + plan.plan_number).appendTo(planDetailsRow);
  $("<td/>").text("Eligible: " + getTypeSpecificDates(dates, "eligibilty")).appendTo(planDetailsRow);
  $("<td/>").text("Plan: " + getTypeSpecificDates(dates, "plan")).appendTo(planDetailsRow);
  $("<td/>").text("Service: " + getTypeSpecificDates(dates, "service")).appendTo(planDetailsRow);
  planDetailsRow.appendTo(benefitsBody);

  var details = $("<div/>", {"id": "benefits_accordion"});

  $("<h3/>", {"text": "Additional Insurance Policies"}).appendTo(details);
  var additionalInsurance = buildAdditionalInsuranceElement(plan.additional_insurance_policies);
  additionalInsurance.appendTo(details);

  $("<h3/>", {"text": "Exclusion"}).appendTo(details);
  var exclusion = buildExclusionElement(plan.exclusions);
  exclusion.appendTo(details);

  $("<h3/>", {"text": "Providers"}).appendTo(details);
  var provider = buildProviderElement(primaryInsurance.service_providers.physicians);
  provider.appendTo(details);

  $("<h3/>", {"text": "Deductible"}).appendTo(details);
  var deductible = buildFinancialElement(plan.financials.deductible);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Stop Loss"}).appendTo(details);
  var deductible = buildFinancialElement(plan.financials.stop_loss);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Spending Account"}).appendTo(details);
  var deductible = buildAmountElement(plan.financials.spending_account.remaining);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Coinsurance"}).appendTo(details);
  var deductible = buildNetworkAmountElement(plan.financials.coinsurance.percents);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Copayment"}).appendTo(details);
  var deductible = buildNetworkAmountElement(plan.financials.copayment.amounts);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Cost Containment"}).appendTo(details);
  var deductible = buildFinancialElement(plan.financials.cost_containment);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Spend Down"}).appendTo(details);
  var deductible = buildFinancialElement(plan.financials.spend_down);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Limitations"}).appendTo(details);
  var deductible = buildAmountElement(plan.financials.limitations.amounts);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Disclaimer"}).appendTo(details);
  var deductible = buildDisclaimerElement(plan.financials.disclaimer);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Other Sources"}).appendTo(details);
  var deductible = buildAmountElement(plan.financials.other_sources.amounts);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Benefit Description"}).appendTo(details);
  var deductible = buildAmountElement(plan.benefit_details.benefit_description.amounts);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Managed Care"}).appendTo(details);
  var deductible = buildAmountElement(plan.benefit_details.managed_care.amounts);
  deductible.appendTo(details);

  $("<h3/>", {"text": "Unlimited"}).appendTo(details);
  var deductible = buildAmountElement(plan.benefit_details.unlimited.amounts);
  deductible.appendTo(details);

  details.insertAfter(benefitsTable);

  return benefits;
};

buildAdditionalInsuranceElement = function(additionalInsurances) {
  var additionalInsurancePolicies = $("<div/>");
  var additionalInsuranceTable = $("<table class=\"table table-bordered\"/>").appendTo(additionalInsurancePolicies);

  var row1 = $("<tr/>").appendTo(additionalInsuranceTable);
  $("<th/>", {"text": "Insurance Type"}).appendTo(row1);
  $("<th/>", {"text": "Payer Type"}).appendTo(row1);
  $("<th/>", {"text": "Identification Type"}).appendTo(row1);
  $("<th/>", {"text": "Identification Value"}).appendTo(row1);
  $("<th/>", {"text": "Coverage Description"}).appendTo(row1);
  $("<th/>", {"text": "References"}).appendTo(row1);
  $("<th/>", {"text": "Contact Details"}).appendTo(row1);
  $("<th/>", {"text": "Dates"}).appendTo(row1);
  $("<th/>", {"text": "Comments"}).appendTo(row1);

  $.each(additionalInsurances, function(index, current) {
    var parsedObj = parseAdditionalInsurance(current);
    var contactDetailsObj = current.contact_details[0];
    var row = $("<tr/>").appendTo(additionalInsuranceTable);
    $("<td/>", {"text": parsedObj.insuranceType}).appendTo(row);
    $("<td/>", {"text": contactDetailsObj == undefined ? "" : contactDetailsObj.type_label}).appendTo(row);
    $("<td/>", {"text": contactDetailsObj == undefined ? "" : contactDetailsObj.identification_type}).appendTo(row);
    $("<td/>", {"text": contactDetailsObj == undefined ? "" : contactDetailsObj.identification_code}).appendTo(row);
    $("<td/>", {"text": parsedObj.coverage_description}).appendTo(row);
    $("<td/>", {"text": parsedObj.reference}).appendTo(row);
    $("<td/>", {"text": parsedObj.contactDetails}).appendTo(row);
    $("<td/>", {"text": parsedObj.dates}).appendTo(row);
    $("<td/>", {"text": parsedObj.comments}).appendTo(row);
  });

  return additionalInsurancePolicies;
};

buildExclusionElement = function(exclusions) {
  var exclusion = $("<div/>");
  var nonCoveredElement = buildNonCoveredElement(exclusions.noncovered);
  nonCoveredElement.appendTo(exclusion);

  var pre_condition = buildPreConditionElement(exclusions.pre_exisiting_condition);
  pre_condition.appendTo(exclusion)
  return exclusion;
};


buildNonCoveredElement = function(noncovered) {
  var nonCoveredElement = $("<div/>");
  $("<h4/>", {"text": "Non Covered: "}).appendTo(nonCoveredElement);

  $.each(noncovered, function(index, current) {
    var parsedObject = parseNonCovered(current);
    if (!$.isEmptyObject(parsedObject)) {
      $("<h5/>", {"text": parsedObject.type}).appendTo(nonCoveredElement);
      var ul = $("<ul/>").appendTo(nonCoveredElement);
      $("<li/>", {"text": parsedObject.pos}).appendTo(ul);
      $("<li/>", {"text": parsedObject.auth}).appendTo(ul);
      $("<li/>", {"text": parsedObject.contactDetails}).appendTo(ul);
      $("<li/>", {"text": parsedObject.dates}).appendTo(ul);
      $("<li/>", {"text": parsedObject.comments}).appendTo(ul);
    }
  });
  return nonCoveredElement;
};

buildDisclaimerElement = function(data) {
  var disclaimer = $("<div/>", {"text": parseComments(data)});
  return disclaimer;
};

buildFinancialElement = function(data) {
  var financial = $("<div/>");
  var financialTable = $("<table class=\"table table-bordered\"/>");

  var row1 = $("<tr/>").appendTo(financialTable);
  $("<th/>", {"text": "Network"}).appendTo(row1);
  $("<th/>", {"text": "Amount"}).appendTo(row1);
  $("<th/>", {"text": "Period"}).appendTo(row1);
  $("<th/>", {"text": "Level"}).appendTo(row1);
  $("<th/>", {"text": "Insurance Type"}).appendTo(row1);
  $("<th/>", {"text": "POS"}).appendTo(row1);
  $("<th/>", {"text": "Auth"}).appendTo(row1);
  $("<th/>", {"text": "Eligibility Date"}).appendTo(row1);
  $("<th/>", {"text": "Comments"}).appendTo(row1);

  addFinancialElementRowsToTable(data.remainings.in_network, "IN", "remainings", financialTable);
  addFinancialElementRowsToTable(data.remainings.out_network, "OUT", "remainings", financialTable);
  addFinancialElementRowsToTable(data.totals.in_network, "IN", "totals", financialTable);
  addFinancialElementRowsToTable(data.totals.out_network, "OUT", "totals", financialTable);

  financialTable.appendTo(financial);
  return financial;
};


buildAmountElement = function(amounts) {
  var amount = $("<div/>");
  var amountTable = $("<table class=\"table table-bordered\"/>");

  var row1 = $("<tr/>").appendTo(amountTable);
  $("<th/>", {"text": "Network"}).appendTo(row1);
  $("<th/>", {"text": "Amount"}).appendTo(row1);
  $("<th/>", {"text": "Time Period"}).appendTo(row1);
  $("<th/>", {"text": "Level"}).appendTo(row1);
  $("<th/>", {"text": "Insurance Type"}).appendTo(row1);
  $("<th/>", {"text": "POS"}).appendTo(row1);
  $("<th/>", {"text": "Auth"}).appendTo(row1);
  $("<th/>", {"text": "Eligibility Date"}).appendTo(row1);
  $("<th/>", {"text": "Comments"}).appendTo(row1);

  addAmountsElementRowsToTable(amounts, null, amountTable);

  amountTable.appendTo(amount);
  return amount;

};

buildNetworkAmountElement = function(amounts) {
  var amount = $("<div/>");
  var amountTable = $("<table class=\"table table-bordered\"/>");

  var row1 = $("<tr/>").appendTo(amountTable);
  $("<th/>", {"text": "Network"}).appendTo(row1);
  $("<th/>", {"text": "Amount"}).appendTo(row1);
  $("<th/>", {"text": "Time Period"}).appendTo(row1);
  $("<th/>", {"text": "Level"}).appendTo(row1);
  $("<th/>", {"text": "Insurance Type"}).appendTo(row1);
  $("<th/>", {"text": "POS"}).appendTo(row1);
  $("<th/>", {"text": "Auth"}).appendTo(row1);
  $("<th/>", {"text": "Eligibility Date"}).appendTo(row1);
  $("<th/>", {"text": "Comments"}).appendTo(row1);

  addAmountsElementRowsToTable(amounts.in_network, "IN", amountTable);
  addAmountsElementRowsToTable(amounts.out_network, "OUT", amountTable);


  amountTable.appendTo(amount);
  return amount;

};


addFinancialElementRowsToTable = function(data, network, period, table) {
  $.each(data, function(index, current) {
    var row = $("<tr/>").appendTo(table);
    $("<td/>", {"text": network}).appendTo(row);
    $("<td/>", {"text": current.amount}).appendTo(row);
    $("<td/>", {"text": (period == "remainings" ? "remaining" : current.time_period_label)}).appendTo(row);
    $("<td/>", {"text": current.level}).appendTo(row);
    $("<td/>", {"text": current.insurance_type_label}).appendTo(row);
    $("<td/>", {"text": current.pos_label}).appendTo(row);
    $("<td/>", {"text": current.authorization_required}).appendTo(row);
    $("<td/>", {"text": getTypeSpecificDates(current.dates, "eligibilty")}).appendTo(row);
    $("<td/>", {"text": parseComments(current.comments)}).appendTo(row);
  });
};

addAmountsElementRowsToTable = function(amounts, network, table) {
  $.each(amounts, function(index, current) {
    var row = $("<tr/>").appendTo(table);
    $("<td/>", {"text": isPresent(network) ? network : current.network}).appendTo(row);
    $("<td/>", {"text": isPresent(current.percent) ? current.percent : current.amount}).appendTo(row);
    $("<td/>", {"text": current.time_period_label}).appendTo(row);
    $("<td/>", {"text": current.level}).appendTo(row);
    $("<td/>", {"text": current.insurance_type_label}).appendTo(row);
    $("<td/>", {"text": current.pos_label}).appendTo(row);
    $("<td/>", {"text": current.authorization_required}).appendTo(row);
    $("<td/>", {"text": getTypeSpecificDates(current.dates, "eligibilty")}).appendTo(row);
    $("<td/>", {"text": parseComments(current.comments)}).appendTo(row);
  });
};


buildPreConditionElement = function(precondition) {
  var element = $("<div/>").addClass("PreExisting");
  return element;
};

buildProviderElement = function(physicians) {
  var providerDiv = $("<div/>");
  $.each(physicians, function(index, current) {
    var providerObj = parseProvider(current);
    var ul = $("<ul/>").appendTo(providerDiv);
    $("<li/>", {"text": providerObj.contactDetails}).appendTo(ul);
    $("<li/>", {"text": "Insurance Type:" + providerObj.insuranceType}).appendTo(ul);
    $("<li/>", {"text": "Primary Care" + providerObj.primaryCare}).appendTo(ul);
    $("<li/>", {"text": "Restricted" + providerObj.restricted}).appendTo(ul);
    $("<li/>", {"text": providerObj.dates}).appendTo(ul);
    $("<li/>", {"text": providerObj.comments}).appendTo(ul);
  });

  return providerDiv;
};

formatDates = function(start, end) {
  if ((start == undefined || start == "") && (end == undefined || end == "")) {
    return "";
  } else if (start == undefined || start == "") {
    return end;
  } else if (end == undefined || end == "") {
    return start;
  } else {
    return start + " to " + end;
  }
};

getTypeSpecificDates = function(dates, type) {
  var start;
  var end;
  $.each(dates, function(index, date) {
    if (date.date_type == type || date.date_type == type + "_begin") {
      start = date.date_value;
    } else if (date.date_type == type + "_end") {
      end = date.date_value;
    }
  });
  return formatDates(start, end);
};

parseAdditionalInsurance = function(additionalInsurance) {
  var additionalInsuranceObj = {};

  additionalInsuranceObj.insuranceType = additionalInsurance.insurance_type_label;
  additionalInsuranceObj.coverage_description = additionalInsurance.coverage_description;
  additionalInsuranceObj.reference = parseReference(additionalInsurance.reference);
  additionalInsuranceObj.contactDetails = parseContactDetails(additionalInsurance.contact_details);
  additionalInsuranceObj.dates = parseDates(additionalInsurance.dates);
  additionalInsuranceObj.comments = parseComments(additionalInsurance.comments);
  return additionalInsuranceObj;
};

parseReference = function(reference) {
  var referenceString = "";
  $.each(reference, function(index, current) {
    if (referenceString != "") {
      referenceString += ", " + current.reference_label + ": " + current.reference_number;
    } else {
      referenceString += current.reference_label + ": " + current.reference_number;
    }
  });
  return referenceString;
};

parseCoverageBasis = function(coverage_basis) {
  var coverage = "";

  $.each(coverage_basis, function(index, current) {
    //TODO: Parse coverage_basis here
  });

  return coverage;

};

parseNonCovered = function(nonCovered) {
  var nonCoveredElement = {};
  if (!isEmptyDetails(nonCovered)) {
    nonCoveredElement.type = nonCovered.type + " - " + nonCovered.type_label;
    nonCoveredElement.pos = nonCovered.pos_label;
    nonCoveredElement.auth = nonCovered.authorization_required;
    nonCoveredElement.contactDetails = parseContactDetails(nonCovered.contact_details);
    nonCoveredElement.dates = parseDates(nonCovered.dates);
    nonCoveredElement.comments = parseComments(nonCovered.comments);
  }
  return nonCoveredElement;
};

parseProvider = function(provider) {
  var providerObject = {};

  providerObject.contactDetails = parseContactDetails(provider.contact_details);
  providerObject.insuranceType = provider.insurance_type_label;
  providerObject.primaryCare = provider.primary_care;
  providerObject.restricted = provider.restricted;
  providerObject.dates = parseDates(provider.dates);
  providerObject.comments = parseComments(provider.comments);
  return providerObject;
};


isEmptyDetails = function(details) {
  if ((details.pos === null || details.pos === '')
    && (details.authorization_required === null || details.authorization_required === '')
    && (details.contact_details === null || details.contact_details.length == 0)
    && (details.dates === null || details.dates.length == 0)
    && (details.comments === null || details.comments.length == 0)) {
    return true;
  } else {
    return false
  }

};

parseDates = function(dates) {
  var datesString = "";
  $.each(dates, function(index, current) {
    if (datesString != "") {
      datesString += ", " + current.date_type + ": " + current.date_value;
    } else {
      datesString = current.date_type + ": " + current.date_value;
    }
  });

  if (datesString != "") {
    datesString = "Dates: " + datesString;
  }

  return datesString;
};

parseComments = function(comments) {
  var commentString = "";
  $.each(comments, function(index, comment) {
    commentString = commentString + "\n" + comment;
  });

  if (commentString != "") {
    commentString = "Free Text: " + commentString;
  }
  return commentString;
};

parseContactDetails = function(contactDetails) {
  var details = "Contact Details: ";
  $.each(contactDetails, function(index, current) {
    details += parseName(current);
    details += parseAddress(current.address) == "" ? "" : ", " + parseAddress(current.address);
    details += parseContacts(current.contacts) == "" ? "" : ", " + parseContacts(current.contacts)
  });
  return details;
};

parseName = function(data) {
  var name = "";

  name = data.first_name;
  if (isPresent(name) && isPresent(data.last_name)) {
    name += " " + data.last_name;
  } else if (isPresent(data.last_name)) {
    name = data.last_name;
  }

  if (name != "") {
    name = "Name: " + name;
  }
  return name;
};

parseAddress = function(addressData) {
  var address = "";
  for (key in addressData) {
    if (isPresent(addressData[key])) {
      if (address != "") {
        address = address + ", " + addressData[key];
      } else {
        address = addressData[key];
      }
    }
  }

  if (address != "") {
    address = "Address: " + address;
  }
  return address;
};

parseContacts = function(contactData) {
  var contacts = "";
  $.each(contactData, function(index, contact) {
    if (contacts != "") {
      contacts = contacts + ", " + capitalise(contact.contact_type) + ": " + contact.contact_value;
    } else {
      contacts = capitalise(contact.contact_type) + ": " + contact.contact_value;
    }
  });

  if (contacts != "") {
    contacts = "Contacts: " + contacts;
  }
  return contacts;
};

capitalise = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

isPresent = function(object) {
  if (object == undefined || object == null || object == "") {
    return false;
  } else {
    return true;
  }
};

coverageStatus = function(data) {
  var status;
  if (data.coverage_status == "1" || data.coverage_status == "2" || data.coverage_status == "3" || data.coverage_status == "4" || data.coverage_status == "5") {
    status = "Active";
  } else {
    status = "Inactive";
  }

  return status;
};