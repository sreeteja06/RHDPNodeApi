use rhdpTest;
GO

create table distDurData
(
  JID int not null,
  Duration int not null,
  Distance int not null,
  Time DATETIME NOT NULL
);
GO

SELECT AVG(Duration) as AVGDuration, MIN(Time) as startingTime
FROM [dbo].[distDurData]
where JID = 51
Group by DATEPART(YEAR, Time),
DATEPART(MONTH, Time),
DATEPART(DAY, Time),
DATEPART(HOUR, Time),
(DATEPART(MINUTE, Time) / 5)