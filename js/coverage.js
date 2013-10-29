coverage_url = "https://gds.eligibleapi.com/v1.1/coverage/all.json"

showForm = function () {
  $(".test-param").hide();
  $(".real-param").show();
}

showTest = function () {
  $(".real-param").hide();
  $(".test-param").show();
}

errorCallback = function (xhr, textStatus, errorThrown) {
  window.alert("Error on request: " + errorThrown);
}

successCallback = function (data) {
  $(".has-error").removeClass("has-error");

  $(".eligible-plugin-coverage-template").remove();
  if (data.error) {
    buildError(data.error);
  } else {
    buildCoverageHTML(data);
  }

  //$("#benefits_accordion").accordion();
}

objectToUrlParameters = function (obj) {
  var str = "";
  for (var key in obj) {
    if (str != "") {
      str += "&";
    }
    str += key + "=" + encodeURIComponent(obj[key]);
  }
  return str;
};

coverageRequest = function (params) {
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
    success: function (data, textStatus, jqXHR) {
      console.log("GET Ajax Call SUCCESS URL:" + coverage_url + "?" + parameters + ", Status :" + textStatus)
      successCallback(data);
    },
    error: function (xhr, textStatus, errorThrown) {
      console.log("GET Ajax Call FAILURE URL:" + coverage_url + "?" + parameters + ", Status :", textStatus, ", Error: ", errorThrown)
      errorCallback(xhr, textStatus, errorThrown);
    }
  };

  $.ajax(coverage_url, options);
}


$(document).ready(function () {
  if ($("input[name=test]:checked").val() == "true") {
    showTest();
  } else {
    showForm();
  }

  $("input[name=test]").on('click', function () {
    if ($(this).val() == 'true') {
      showTest();
    } else {
      showForm();
    }
  });

  $(".form-coverage").on('submit', function (e) {
    e.preventDefault();

    var test = $("input[name=test]:checked").val();

    if (test == "true") {
      fetchTestCoverage();
    } else {
      fetchRealCoverage();
    }
  });
});

fetchRealCoverage = function () {
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

  $.each(params, function (key) {
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

fetchTestCoverage = function () {
  var params = {
    api_key: $("#api_key").val(),
    test_member_id: $("#test_member_id").val()
  };

  $.each(params, function (key) {
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

buildError = function (error) {
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


buildCoverageHTML = function (data) {
  var coverageSection = $("<section/>").addClass("eligible-plugin-coverage-template");

  // Build demographics
  if (data['demographics']) {
    if (data['demographics']['subscriber'] && data['demographics']['subscriber']['first_name']) {
      coverageSection.append(buildPanelUI('Subscriber', buildDemographics(data['demographics']['subscriber'], "Subscriber")));
    }
    if (data['demographics']['dependent'] && data['demographics']['dependent']['first_name']) {
      coverageSection.append(buildPanelUI('Dependent', buildDemographics(data['demographics']['dependent'], "Dependent")));
    }
  }

  // Build primary insurance
  if (data['primary_insurance'] && data['primary_insurance']['name']) {
    coverageSection.append(buildPanelUI('Primary Insurance', buildPrimaryInsurance(data['primary_insurance'])));
  }

  // Build plan detail
  if (data['plan'] && data['plan']['coverage_status']) {
    coverageSection.append(buildPanelUI('Plan', buildPlan(data['plan'])));
  }

  // Build additional insurance policies
  if (data['plan'] && data['plan']['additional_insurance_policies'] && data['plan']['additional_insurance_policies'].length > 0) {
    coverageSection.append(buildPanelUI('Additional Insurance Policies', buildAdditionalInsurancePolicies(data['plan']['additional_insurance_policies'])));
  }

  // Adding benefits
  var benefits = buildCoveragePlanBenefits(data);
  benefits.appendTo(coverageSection);

  // Adding Service details

  var body = $('body');
  coverageSection.appendTo(body);
};

buildPanelUI = function (title, content) {
  var panel = $('<div class="panel panel-default">');
  panel.append($('<div class="panel-heading"><h4>' + title + '</h4></div>'));
  var contentPanel = $('<div class="panel-body"></div>');
  contentPanel.append(content);
  panel.append(contentPanel);
  return panel;
}

buildDemographics = function (person) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  $("<th/>", {text: "Primary ID"}).appendTo(rowHead);
  $("<td/>", {text: person['member_id']}).appendTo(row);

  $("<th/>", {text: "Name / Address"}).appendTo(rowHead);
  $("<td/>", {html: parseNameAndAddress(person).join("<br/>")}).appendTo(row);

  $("<th/>", {text: "Date of Birth"}).appendTo(rowHead);
  $("<td/>", {text: person['dob']}).appendTo(row);

  $("<th/>", {text: "Gender"}).appendTo(rowHead);
  $("<td/>", {text: parseGender(person['gender'])}).appendTo(row);

  $("<th/>", {text: "Additional Information"}).appendTo(rowHead);
  $("<td/>", {html: parsePersonAdditionalInfo(person).join("<br/>")}).appendTo(row);

  return(table);
}

parseNameAndAddress = function (person) {
  var result = new Array();

  result.push(parseName(person));

  if (person['address']) {
    result = result.concat(parseAddress(person['address']));
  }

  return(result);
}

parseGender = function (gender) {
  if (gender == 'F') {
    return "Female";
  } else if (gender == 'M') {
    return "Male";
  } else {
    return '';
  }
}

parsePersonAdditionalInfo = function (person) {
  var additionalInformation = new Array();
  if (person['group_id']) {
    additionalInformation.push("Group ID: " + person['group_id']);
  }
  if (person['group_name']) {
    additionalInformation.push("Group Name: " + person['group_name']);
  }
  return additionalInformation;
}

buildPrimaryInsurance = function (primaryInsurance) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  $("<th/>", {text: "Name"}).appendTo(rowHead);
  $("<td/>", {text: primaryInsurance['name']}).appendTo(row);

  $("<th/>", {text: "ID"}).appendTo(rowHead);
  $("<td/>", {text: primaryInsurance['id']}).appendTo(row);

  $("<th/>", {text: "Contacts"}).appendTo(rowHead);
  $("<td/>", {html: parseContacts(primaryInsurance['contacts']).join("<br/>")}).appendTo(row);

  return(table);
}

buildPlan = function (plan) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  rowHead.append("<th>Coverage Status</th>");
  row.append("<td>" + coverageStatus(plan) + "</td>")

  if (plan['plan_name'] && plan['plan_name'].length > 0) {
    $("<th/>", {text: "Plan Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_name']}).appendTo(row);
  }

  if (plan['plan_type_label'] && plan['plan_type_label'].length > 0) {
    $("<th/>", {text: "Plan Type"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_type_label']}).appendTo(row);
  }

  if (plan['group_name'] && plan['group_name'].length > 0) {
    $("<th/>", {text: "Group Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);
  }

  if (plan['plan_number'] && plan['plan_number'].length > 0) {
    $("<th/>", {text: "Plan Number"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_number']}).appendTo(row);
  }

  if (plan['dates']) {
    var eligibleDates = getTypeSpecificDates(plan['dates'], "eligibilty");
    var planDates = getTypeSpecificDates(plan['dates'], "plan");
    var serviceDates = getTypeSpecificDates(plan['dates'], "service");

    if (eligibleDates && eligibleDates.length > 0) {
      $("<th/>", {text: "Eligible"}).appendTo(rowHead);
      $("<td/>", {text: eligibleDates}).appendTo(row);
    }

    if (planDates && planDates.length > 0) {
      $("<th/>", {text: "Plan"}).appendTo(rowHead);
      $("<td/>", {text: planDates}).appendTo(row);
    }

    if (serviceDates && serviceDates.length > 0) {
      $("<th/>", {text: "Service"}).appendTo(rowHead);
      $("<td/>", {text: serviceDates}).appendTo(row);
    }
  }

  return(table);
}

buildAdditionalInsurancePolicies = function (additionalPolicies) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);

  $("<th/>", {text: "Insurance Type"}).appendTo(rowHead);
  $("<th/>", {text: "Coverage Description"}).appendTo(rowHead);
  $("<th/>", {text: "References"}).appendTo(rowHead);
  $("<th/>", {text: "Contact Details"}).appendTo(rowHead);
  $("<th/>", {text: "Dates"}).appendTo(rowHead);
  $("<th/>", {text: "Comments"}).appendTo(rowHead);

  $.each(additionalPolicies, function (index, policy) {
    var row = $("<tr/>").appendTo(tableBody);

    $("<td/>", {text: policy['insurance_type_label']}).appendTo(row);
    $("<td/>", {text: policy['coverage_description']}).appendTo(row);
    $("<td/>", {html: parseReference(policy['reference']).join("<br/>")}).appendTo(row);
    $("<td/>", {html: parseContactDetails(policy['contact_details']).join("<br/>")}).appendTo(row);
    $("<td/>", {html: parseDates(policy['dates']).join("<br/>")}).appendTo(row);
    $("<td/>", {html: parseComments(policy['comments']).join("<br/>")}).appendTo(row);
  });

  return(table);
}


buildCoveragePlanBenefits = function (data) {
  var plan = data.plan;
  var primaryInsurance = data.primary_insurance;

  var benefits = $("<div/>").addClass("content benefits");
  var benefitsTable = $("<table class=\"table table-hover\"/>").appendTo(benefits);
  var benefitsBody = $("<tbody/>").appendTo(benefitsTable);

  var details = $("<div/>", {"id": "benefits_accordion"});

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

buildExclusionElement = function (exclusions) {
  var exclusion = $("<div/>");
  var nonCoveredElement = buildNonCoveredElement(exclusions.noncovered);
  nonCoveredElement.appendTo(exclusion);

  var pre_condition = buildPreConditionElement(exclusions.pre_exisiting_condition);
  pre_condition.appendTo(exclusion)
  return exclusion;
};


buildNonCoveredElement = function (noncovered) {
  var nonCoveredElement = $("<div/>");
  $("<h4/>", {"text": "Non Covered: "}).appendTo(nonCoveredElement);

  $.each(noncovered, function (index, current) {
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

buildDisclaimerElement = function (data) {
  var disclaimer = $("<div/>", {"text": parseComments(data).join("<br/>")});
  return disclaimer;
};

buildFinancialElement = function (data) {
  var financial = $("<div/>");
  var financialTable = $("<table class=\"table table-hover\"/>");

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


buildAmountElement = function (amounts) {
  var amount = $("<div/>");
  var amountTable = $("<table class=\"table table-hover\"/>");

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

buildNetworkAmountElement = function (amounts) {
  var amount = $("<div/>");
  var amountTable = $("<table class=\"table table-hover\"/>");

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


addFinancialElementRowsToTable = function (data, network, period, table) {
  $.each(data, function (index, current) {
    var row = $("<tr/>").appendTo(table);
    $("<td/>", {"text": network}).appendTo(row);
    $("<td/>", {"text": current.amount}).appendTo(row);
    $("<td/>", {"text": (period == "remainings" ? "remaining" : current.time_period_label)}).appendTo(row);
    $("<td/>", {"text": current.level}).appendTo(row);
    $("<td/>", {"text": current.insurance_type_label}).appendTo(row);
    $("<td/>", {"text": current.pos_label}).appendTo(row);
    $("<td/>", {"text": current.authorization_required}).appendTo(row);
    $("<td/>", {"text": getTypeSpecificDates(current.dates, "eligibilty")}).appendTo(row);
    $("<td/>", {"text": parseComments(current.comments).join("<br/>")}).appendTo(row);
  });
};

addAmountsElementRowsToTable = function (amounts, network, table) {
  $.each(amounts, function (index, current) {
    var row = $("<tr/>").appendTo(table);
    $("<td/>", {"text": isPresent(network) ? network : current.network}).appendTo(row);
    $("<td/>", {"text": isPresent(current.percent) ? current.percent : current.amount}).appendTo(row);
    $("<td/>", {"text": current.time_period_label}).appendTo(row);
    $("<td/>", {"text": current.level}).appendTo(row);
    $("<td/>", {"text": current.insurance_type_label}).appendTo(row);
    $("<td/>", {"text": current.pos_label}).appendTo(row);
    $("<td/>", {"text": current.authorization_required}).appendTo(row);
    $("<td/>", {"text": getTypeSpecificDates(current.dates, "eligibilty")}).appendTo(row);
    $("<td/>", {"text": parseComments(current.comments).join("<br/>")}).appendTo(row);
  });
};


buildPreConditionElement = function (precondition) {
  var element = $("<div/>").addClass("PreExisting");
  return element;
};

buildProviderElement = function (physicians) {
  var providerDiv = $("<div/>");
  $.each(physicians, function (index, current) {
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

formatDates = function (start, end) {
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

getTypeSpecificDates = function (dates, type) {
  var start;
  var end;
  $.each(dates, function (index, date) {
    if (date.date_type == type || date.date_type == type + "_begin") {
      start = date.date_value;
    } else if (date.date_type == type + "_end") {
      end = date.date_value;
    }
  });
  return formatDates(start, end);
};

parseReference = function (reference) {
  var result = new Array();

  $.each(reference, function (index, current) {
    result.push(current.reference_label + ": " + current.reference_number);
  });

  return result;
};

parseCoverageBasis = function (coverage_basis) {
  var coverage = "";

  $.each(coverage_basis, function (index, current) {
    //TODO: Parse coverage_basis here
  });

  return coverage;

};

parseNonCovered = function (nonCovered) {
  var nonCoveredElement = {};
  if (!isEmptyDetails(nonCovered)) {
    nonCoveredElement.type = nonCovered.type + " - " + nonCovered.type_label;
    nonCoveredElement.pos = nonCovered.pos_label;
    nonCoveredElement.auth = nonCovered.authorization_required;
    nonCoveredElement.contactDetails = parseContactDetails(nonCovered.contact_details);
    nonCoveredElement.dates = parseDates(nonCovered.dates).join("<br/>");
    nonCoveredElement.comments = parseComments(nonCovered.comments).join("<br/>");
  }
  return nonCoveredElement;
};

parseProvider = function (provider) {
  var providerObject = {};

  providerObject.contactDetails = parseContactDetails(provider.contact_details);
  providerObject.insuranceType = provider.insurance_type_label;
  providerObject.primaryCare = provider.primary_care;
  providerObject.restricted = provider.restricted;
  providerObject.dates = parseDates(provider.dates).join("<br/>");
  providerObject.comments = parseComments(provider.comments).join("<br/>");
  return providerObject;
};


isEmptyDetails = function (details) {
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

parseDates = function (dates) {
  var list = new Array();

  $.each(dates, function (index, current) {
    list.push(current.date_type + ": " + current.date_value);
  });

  return(list);
};

parseComments = function (comments) {
  var list = new Array();

  $.each(comments, function (index, comment) {
    list.push(comment);
  });

  return(list);
};

parseContactDetails = function (contactDetails) {
  var list = new Array();
  $.each(contactDetails, function (index, details) {
    var detailsList = new Array();
    detailsList.push(parseName(details));
    if (details['address'] && details['address']['street_line_1']) {
      detailsList.push(parseAddress(details['address']));
    }
    if (details['contacts'] && details['contacts'].length > 0) {
      detailsList.push(parseContacts(details['contacts']));
    }
    list.push(detailsList);
  });
  return(list);
};

parseName = function (data) {
  firstName = data['first_name'];
  lastName = data['last_name'];

  if (isPresent(firstName) && isPresent(lastName)) {
    return(firstName + " " + lastName);
  } else if (isPresent(firstName)) {
    return(firstName);
  } else if (isPresent(lastName)) {
    return(lastName);
  } else {
    return "";
  }
};

parseAddress = function (addressData) {
  var list = new Array();
  if (addressData['street_line_1'] && addressData['street_line_1'].length > 0) {
    list.push(addressData['street_line_1']);
    if (addressData['street_line_2'] && addressData['street_line_2'].length > 0) {
      list.push(addressData['street_line_2']);
    }
  }

  if (addressData['city']) {
    if (addressData['city'] == addressData['state']) {
      list.push(addressData['state'] + ", " + addressData['zip']);
    } else {
      list.push(addressData['city'] + ", " + addressData['state'] + ", " + addressData['zip']);
    }
  }

  return(list);
};

parseContacts = function (contactData) {
  var contacts = new Array();

  $.each(contactData, function (index, contact) {
    contacts.push(capitalise(contact.contact_type) + ": " + contact.contact_value);
  });

  return contacts;
};

capitalise = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

isPresent = function (object) {
  if (object == undefined || object == null || object == "") {
    return false;
  } else {
    return true;
  }
};

coverageStatus = function (data) {
  var status;
  if (data.coverage_status == "1" || data.coverage_status == "2" || data.coverage_status == "3" || data.coverage_status == "4" || data.coverage_status == "5") {
    status = "Active";
  } else {
    status = "Inactive";
  }

  return status;
};