---
layout: post
title:  "Using Treasury Direct API to Look at Treasury Auctions"
date:   2019-11-25
desc: "I'm analyzing Treasury auctions using a simple API"
keywords: "treasuries, auctions, treasury direct"
categories: [Coding]
tags: [treasury,auctions,debt]
icon: icon-html
---
For my analysis of [central bank monetary policy](https://nikitagold.com/html/2019/11/01/monetary-policy.html) I wanted to look at the impact that higher debt levels and lower yields were having on Treasury auctions.

The go to source for this info is [TreasuryDirect.Gov](https://www.treasurydirect.gov). Like most things the government produces, it is a well-meaning and publicly-accessible good, but it lacks the bells and whistles of a private sector website.

I wanted to get a time series of the bid-to-cover ratio which is the amount of bids submitted in dollars compared to the amount of debt that was being sold. However, I was unable to find this data easy to procure.

The site does have an auction [query editor](https://www.treasurydirect.gov/instit/annceresult/annceresult_query.htm) but it is some kind of widget and I found it somewhat difficult to scrape with my rudimentary scraping skills (if you know how to do it, would love to know). Since there's only ~8k records and you can download 1000 at a time, I thought I would suck it up and do the thing I hate most, a manual process.

I've made the list of CUSIPs available [here](https://github.com/dumplingcompromise/treasurydirect/blob/master/treasuries.csv)

After downloading and compiling the basic CUSIP data, I wanted to get extended information about each respective auction. Thankfully treasurydirect provides an API for that.
The API takes in a CUSIP and issue date and returns the following data:

```
{'cusip': '9128272D3',
 'issueDate': '1996-12-31T00:00:00',
 'securityType': 'Note',
 'securityTerm': '2-Year',
 'maturityDate': '1998-12-31T00:00:00',
 'interestRate': '5.750000',
 'refCpiOnIssueDate': '',
 'refCpiOnDatedDate': '',
 'announcementDate': '1996-12-11T00:00:00',
 'auctionDate': '1996-12-18T00:00:00',
 'auctionDateYear': '1996',
 'datedDate': '',
 'accruedInterestPer1000': '0E-10',
 'accruedInterestPer100': '',
 'adjustedAccruedInterestPer1000': '',
 'adjustedPrice': '',
 'allocationPercentage': '16.000000',
 'allocationPercentageDecimals': '0',
 'announcedCusip': '',
 'auctionFormat': 'Single-Price',
 'averageMedianDiscountRate': '',
 'averageMedianInvestmentRate': '',
 'averageMedianPrice': '0.000',
 'averageMedianDiscountMargin': '',
 'averageMedianYield': '5.850000',
 'backDated': 'No',
 'backDatedDate': '',
 'bidToCoverRatio': '',
 'callDate': '',
 'callable': 'No',
 'calledDate': '',
 'cashManagementBillCMB': 'No',
 'closingTimeCompetitive': '',
 'closingTimeNoncompetitive': '',
 'competitiveAccepted': '',
 'competitiveBidDecimals': '3',
 'competitiveTendered': '',
 'competitiveTendersAccepted': '',
 'corpusCusip': '',
 'cpiBaseReferencePeriod': '',
 'currentlyOutstanding': '',
 'directBidderAccepted': '',
 'directBidderTendered': '',
 'estimatedAmountOfPubliclyHeldMaturingSecuritiesByType': '',
 'fimaIncluded': '',
 'fimaNoncompetitiveAccepted': '',
 'fimaNoncompetitiveTendered': '',
 'firstInterestPeriod': 'Normal',
 'firstInterestPaymentDate': '1997-06-30T00:00:00',
 'floatingRate': 'No',
 'frnIndexDeterminationDate': '',
 'frnIndexDeterminationRate': '',
 'highDiscountRate': '',
 'highInvestmentRate': '',
 'highPrice': '99.769',
 'highDiscountMargin': '',
 'highYield': '5.8740',
 'indexRatioOnIssueDate': '',
 'indirectBidderAccepted': '',
 'indirectBidderTendered': '',
 'interestPaymentFrequency': 'Semi-Annual',
 'lowDiscountRate': '',
 'lowInvestmentRate': '',
 'lowPrice': '0.000',
 'lowDiscountMargin': '',
 'lowYield': '5.800000',
 'maturingDate': '1996-12-31T00:00:00',
 'maximumCompetitiveAward': '',
 'maximumNoncompetitiveAward': '',
 'maximumSingleBid': '',
 'minimumBidAmount': '',
 'minimumStripAmount': '',
 'minimumToIssue': '',
 'multiplesToBid': '',
 'multiplesToIssue': '',
 'nlpExclusionAmount': '',
 'nlpReportingThreshold': '',
 'noncompetitiveAccepted': '',
 'noncompetitiveTendersAccepted': '',
 'offeringAmount': '18250000000',
 'originalCusip': '',
 'originalDatedDate': '',
 'originalIssueDate': '',
 'originalSecurityTerm': '2-Year',
 'pdfFilenameAnnouncement': '',
 'pdfFilenameCompetitiveResults': '',
 'pdfFilenameNoncompetitiveResults': '',
 'pdfFilenameSpecialAnnouncement': '',
 'pricePer100': '99.769',
 'primaryDealerAccepted': '',
 'primaryDealerTendered': '',
 'reopening': 'No',
 'securityTermDayMonth': '0-Month',
 'securityTermWeekYear': '2-Year',
 'series': 'AN-1998',
 'somaAccepted': '',
 'somaHoldings': '',
 'somaIncluded': '',
 'somaTendered': '',
 'spread': '',
 'standardInterestPaymentPer1000': '28.7500',
 'strippable': '',
 'term': '2-Year',
 'tiinConversionFactorPer1000': '',
 'tips': 'No',
 'totalAccepted': '20575058000',
 'totalTendered': '42958658000',
 'treasuryDirectAccepted': '',
 'treasuryDirectTendersAccepted': '',
 'type': 'Note',
 'unadjustedAccruedInterestPer1000': '',
 'unadjustedPrice': '',
 'updatedTimestamp': '2013-12-12T14:22:36',
 'xmlFilenameAnnouncement': '',
 'xmlFilenameCompetitiveResults': '',
 'xmlFilenameSpecialAnnouncement': ''}

```

I first loaded the data into a pandas dataframe then transformed each CUSIP/Issue date column into a url format that is required by the API like so:
I fed the API a list of CUSIPs that I downloaded

```python
df = pd.read_csv('/treasuries.csv')

def url_gen(cusip,auc_date):
    url = '/securities/{}/{}'.format(cusip,auc_date)
    return url

urls = []
for i in range(0,len(new_df)):
    temp_url = url_gen(new_df['CUSIP'][i],new_df['Issue Date'][i])
    urls.append(temp_url)
```
Finally, for each url in my list of auction URLs, I utilized the requests library to get the data from each respective url, like so:

```python
base_url = 'http://www.treasurydirect.gov/TA_WS'
treasuries = []

for i in urls:
    final_url = base_url + i
    try:
        ##enter your own data points from the API that you would like to return.
        r = requests.get(final_url).json()
        btc = r['bidToCoverRatio']
        cusip = r['cusip']
        issueDate = r['issueDate']
        #print([cusip,issueDate,btc])
        treasuries.append([cusip,issueDate,btc])

    except:
        pass

```

With the data stored as a list of lists, the last step is to create the output dataframe upon which further analysis can be done.

```python
output_df = pd.DataFrame(treasuries,columns = ['CUSIP','Date','BTC'])
```

With this in hand, I was able to create the nice little visual below and chart the bid-to-cover ratio that I was looking for.
