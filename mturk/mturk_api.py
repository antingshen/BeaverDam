import base64
import time
import hashlib
import hmac
import urllib.parse
import urllib.request
from math import ceil
from xml.etree import ElementTree

import logging

logger = logging.getLogger("turkic.api")

class Server(object):
    def __init__(self, mturk_id, mturk_key, localhost, sandbox=False):
        self.mturk_key = bytes(mturk_key, 'utf-8')
        self.mturk_id = mturk_id
        self.localhost = 'https://' + localhost
        self.sandbox = sandbox

        if sandbox:
            self.server = "mechanicalturk.sandbox.amazonaws.com"
        else:
            self.server = "mechanicalturk.amazonaws.com"

    def request(self, operation, parameters = {}):
        """
        Sends the request to the Turk server and returns a response object.
        """

        if not self.mturk_key or not self.mturk_id:
            raise RuntimeError("Signature or access key missing")

        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        hmacstr = hmac.new(self.mturk_key,
            bytes("AWSMechanicalTurkRequester" + operation + timestamp, 'utf-8'), hashlib.sha1)
        hmacstr = base64.encodestring(hmacstr.digest()).strip()

        logger.info("Request to MTurk: {0}".format(operation))
        for paramk, paramv in parameters.items():
            logger.debug("  {0}: {1}".format(paramk, paramv))

        baseurl = "/?" + urllib.parse.urlencode({
                    "Service": "AWSMechanicalTurkRequester",
                    "AWSAccessKeyId": self.mturk_id,
                    "Version": "2008-08-02",
                    "Operation": operation,
                    "Signature": hmacstr,
                    "Timestamp": timestamp})
        url = baseurl + "&" + urllib.parse.urlencode(parameters)
        url = "https://" + self.server + url

        req = urllib.request.Request(url = url)
        data = urllib.request.urlopen(req)
        
        response = Response(operation, data)
        return response

    def create_hit(self, title, description, page, amount, duration,
        lifetime, keywords = "", autoapprove = 604800, height = 950,
        minapprovedpercent = None, minapprovedamount = None, countrycode = None):
        """
        Creates a HIT on Mechanical Turk.
        
        If successful, returns a Response object that has fields:
            hit_id          The HIT ID
            hit_type_id     The HIT group ID

        If unsuccessful, a CommunicationError is raised with a message
        describing the failure.
        """
        r = {"Title": title,
            "Description": description,
            "Keywords": keywords,
            "Reward.1.Amount": amount,
            "Reward.1.CurrencyCode": "USD",
            "AssignmentDurationInSeconds": duration,
            "AutoApprovalDelayInSeconds": autoapprove,
            "LifetimeInSeconds": lifetime}

        qualcounter = 0

        if minapprovedpercent:
            qualcounter += 1
            base = "QualificationRequirement.{0}." .format(qualcounter)
            r[base + "QualificationTypeId"] = "000000000000000000L0"
            r[base + "Comparator"] = "GreaterThanOrEqualTo"
            r[base + "IntegerValue"] = minapprovedpercent 

        if minapprovedamount:
            qualcounter += 1
            base = "QualificationRequirement.{0}." .format(qualcounter)
            r[base + "QualificationTypeId"] = "00000000000000000040"
            r[base + "Comparator"] = "GreaterThanOrEqualTo"
            r[base + "IntegerValue"] = minapprovedamount 

        if countrycode:
            qualcounter += 1
            base = "QualificationRequirement.{0}." .format(qualcounter)
            r[base + "QualificationTypeId"] = "00000000000000000071"
            r[base + "Comparator"] = "EqualTo"
            r[base + "LocaleValue.Country"] = countrycode 

        assert page[0] == '/'
        r["Question"] = ("<ExternalQuestion xmlns=\"http://mechanicalturk"
                         ".amazonaws.com/AWSMechanicalTurkDataSchemas/"
                         "2006-07-14/ExternalQuestion.xsd\">"
                         "<ExternalURL>{0}{1}</ExternalURL>"
                         "<FrameHeight>{2}</FrameHeight>"
                         "</ExternalQuestion>").format(self.localhost,
                                                       page, height)

        r = self.request("CreateHIT", r);
        r.validate("HIT/Request/IsValid", "HIT/Request/Errors/Error/Message")
        r.store("HIT/HITId", "hitid")
        r.store("HIT/HITTypeId", "hittypeid")
        return r
    
    def disable(self, hitid):
        """
        Disables the HIT from the MTurk service.
        """
        r = self.request("DisableHIT", {"HITId": hitid})
        r.validate("DisableHITResult/Request/IsValid",
                   "DisableHITResult/Request/Errors/Error/Message")
        return r

    def purge(self):
        """
        Disables all the HITs on the MTurk server. Useful for debugging.
        """
        while True:
            r = self.request("SearchHITs", {"SortProperty": "CreationTime",
                                            "SortDirection": "Descending",
                                            "PageSize": "100",
                                            "PageNumber": "1"})
            r.validate("SearchHITsResult/Request/IsValid")
            r.store("SearchHITsResult/TotalNumResults", "num", int)
            if r.num == 0:
                return
            for hit in r.tree.findall("SearchHITsResult/HIT"):
                hitid = hit.find("HITId").text.strip()
                try:
                    self.disable(hitid)
                except CommunicationError:
                    pass
            print("Next page")

    def get_assignments(self, hit_id):
        res = self.request('GetAssignmentsForHIT', {"HITId":hit_id})
        if res.has_path("GetAssignmentsForHITResult/Assignment") :
            res.store("GetAssignmentsForHITResult/Request/IsValid", "IsValid", bool)
            res.store("GetAssignmentsForHITResult/Assignment/AssignmentId", "assignment_id")
            res.store("GetAssignmentsForHITResult/Assignment/WorkerId", "worker_id")

            return (res.assignment_id, res.worker_id)

        return (None, None)

        

    def accept(self, assignmentid, feedback = ""):
        """
        Accepts the assignment and pays the worker.
        """
        r = self.request("ApproveAssignment",
                         {"AssignmentId": assignmentid,
                          "RequesterFeedback": feedback})
        r.validate("ApproveAssignmentResult/Request/IsValid",
                   "ApproveAssignmentResult/Request/Errors/Error/Message")
        return r

    def reject(self, assignmentid, feedback = ""):
        """
        Rejects the assignment and does not pay the worker.
        """
        r = self.request("RejectAssignment",
                         {"AssignmentId": assignmentid,
                          "RequesterFeedback": feedback})
        r.validate("RejectAssignmentResult/Request/IsValid",
                   "RejectAssignmentResult/Request/Errors/Error/Message")
        return r

    def bonus(self, workerid, assignmentid, amount, feedback = ""):
        """
        Grants a bonus to a worker for an assignment.
        """
        r = self.request("GrantBonus",
            {"WorkerId": workerid,
             "AssignmentId": assignmentid,
             "BonusAmount.1.Amount": amount,
             "BonusAmount.1.CurrencyCode": "USD",
             "Reason": feedback});
        r.validate("GrantBonusResult/Request/IsValid",
                   "GrantBonusResult/Request/Errors/Error/Message")
        return r

    def block(self, workerid, reason = ""):
        """
        Blocks the worker from working on any of our HITs.
        """
        logger.error("Blocking worker: {}".format(workerid))

        r = self.request("BlockWorker", {"WorkerId": workerid,
                                         "Reason": reason})
        r.validate("BlockWorkerResult/Request/IsValid",
                   "BlockWorkerResult/Request/Errors/Error/Message")
        return r

    def unblock(self, workerid, reason = ""):
        """
        Unblocks the worker and allows him to work for us again.
        """
        r = self.request("UnblockWorker", {"WorkerId": workerid,
                                           "Reason": reason})
        r.validate("UnblockWorkerResult/Request/IsValid",
                   "UnblockWorkerResult/Request/Errors/Error/Message")
        return r

    def email(self, workerid, subject, message):
        """
        Sends an email to the worker.
        """
        r = self.request("NotifyWorkers", {"Subject": subject,
                                           "MessageText": message,
                                           "WorkerId.1": workerid})
        r.validate("NotifyWorkersResult/Request/IsValid",
                   "NotifyWorkersResult/Request/Errors/Error/Message")
        return r

    def getstatistic(self, statistic, type, timeperiod = "LifeToDate"):
        """
        Returns the total reward payout.
        """
        r = self.request("GetRequesterStatistic", {"Statistic": statistic,
                                                   "TimePeriod": timeperiod})
        r.validate("GetStatisticResult/Request/IsValid")
        xmlvalue = "LongValue" if type is int else "DoubleValue"
        r.store("GetStatisticResult/DataPoint/{0}".format(xmlvalue),
                "value", type)
        return r.value

    @property
    def balance(self):
        """
        Returns a response object with the available balance in the amount
        attribute.
        """
        r = self.request("GetAccountBalance")
        r.validate("GetAccountBalanceResult/Request/IsValid")
        r.store("GetAccountBalanceResult/AvailableBalance/Amount",
                "amount", float)
        r.store("GetAccountBalanceResult/AvailableBalance/CurrencyCode",
                "currency")
        return r.amount

    @property
    def rewardpayout(self):
        """
        Returns the total reward payout.
        """
        reward = self.getstatistic("TotalRewardPayout", float)
        bonus = self.getstatistic("TotalBonusPayout", float)
        return reward + bonus

    @property
    def approvalpercentage(self):
        """
        Returns the percent of assignments approved.
        """
        return self.getstatistic("PercentAssignmentsApproved", float)

    @property
    def feepayout(self):
        """
        Returns how much we paid to Amazon in fees.
        """
        reward = self.getstatistic("TotalRewardFeePayout", float)
        bonus = self.getstatistic("TotalBonusFeePayout", float)
        return reward + bonus

    @property
    def numcreated(self):
        """
        Returns the total number of HITs created.
        """
        return self.getstatistic("NumberHITsCreated", int)

class Response(object):
    """
    A generic response from the MTurk server.
    """
    def __init__(self, operation, httpresponse):
        self.operation = operation
        self.httpresponse = httpresponse
        self.data = httpresponse.read()
        logger.error(self.data)
        self.tree = ElementTree.fromstring(self.data)
        self.values = {}
        #print("------------------------------------------------------")
        logger.error('HTTP Response = ' + str(self.data))
        #print("------------------------------------------------------")

    def validate(self, valid, errormessage = None):
        """
        Validates the response and raises an exception if invalid.
        
        Valid contains a path that must contain False if the response
        is invalid.
        
        If errormessage is not None, use this field as the error description.
        """
        valide = self.tree.find(valid)
        if valide is None:
            raise CommunicationError("XML malformed", self)
        elif valide.text.strip() == "False":
            if errormessage:
                errormessage = self.tree.find(errormessage)
                if errormessage is None:
                    raise CommunicationError("Response not valid "
                        "and XML malformed", self)
                raise CommunicationError(errormessage.text.strip(), self)
            else:
                raise CommunicationError("Response not valid", self)
    def has_path(self, path):
        res = self.tree.find(path)
        if res is None:
            return False
        return True

    def has_path(self, path):
        result = self.tree.find(path)
        if result is None:
            return False
        return True

    def store(self, path, name, type = str):
        """
        Stores the text at path into the attribute name.
        """
        node = self.tree.find(path)
        if node is None:
            raise CommunicationError("XML malformed "
                "(cannot find {0})".format(path), self)
        self.values[name] = type(node.text.strip())

    def __getattr__(self, name):
        """
        Used to lookup attributes.
        """
        if name not in self.values:
            raise AttributeError("{0} is not stored".format(name))
        return self.values[name]

class CommunicationError(Exception):
    """
    The error raised due to a communication failure with MTurk.
    """
    def __init__(self, error, response):
        self.error = error
        self.response = response

    def __str__(self):
        return self.error
