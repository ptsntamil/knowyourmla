"""
OpenCity CSV Constants and Default Row Schema
==============================================

Provides standard 47 headers and column defaults matching
scraper/assets/OpenCity_TN_Assembly_Election_2026.csv for election result imports.
"""

OPENCITY_HEADERS = [
    "State_Name", "Assembly_No", "Constituency_No", "Year", "month", "DelimID", "Poll_No",
    "Position", "Candidate", "Sex", "Party", "Votes", "Age", "Candidate_Type", "Valid_Votes",
    "Electors", "Constituency_Name", "Constituency_Type", "District_Name", "Sub_Region",
    "N_Cand", "Turnout_Percentage", "Vote_Share_Percentage", "Deposit_Lost", "Margin",
    "Margin_Percentage", "ENOP", "pid", "Party_Type_TCPD", "Party_ID", "last_poll",
    "Contested", "Last_Party", "Last_Party_ID", "Last_Constituency_Name", "Same_Constituency",
    "Same_Party", "No_Terms", "Turncoat", "Incumbent", "Recontest", "MyNeta_education",
    "TCPD_Prof_Main", "TCPD_Prof_Main_Desc", "TCPD_Prof_Second", "TCPD_Prof_Second_Desc", "Election_Type"
]

ROW_DEFAULTS = {
    "Assembly_No": 13,
    "DelimID": 4,
    "Poll_No": 0,
    "Age": 0,
    "Sex": "",
    "Candidate_Type": "",
    "Sub_Region": "",
    "pid": "",
    "Party_Type_TCPD": "",
    "Party_ID": 0,
    "last_poll": "TRUE",
    "Contested": 1,
    "Last_Party": "",
    "Last_Party_ID": 0,
    "Last_Constituency_Name": "",
    "Same_Constituency": "",
    "Same_Party": "",
    "No_Terms": 0,
    "Turncoat": "FALSE",
    "Incumbent": "FALSE",
    "Recontest": "FALSE",
    "MyNeta_education": "",
    "TCPD_Prof_Main": "",
    "TCPD_Prof_Main_Desc": "",
    "TCPD_Prof_Second": "",
    "TCPD_Prof_Second_Desc": "",
    "Election_Type": "Bye-Election"
}
