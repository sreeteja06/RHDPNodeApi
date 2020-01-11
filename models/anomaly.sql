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

CREATE TABLE anomalyCoordinates(
  Edges         VARCHAR(2) NOT NULL,
  Start_Place   VARCHAR(56) NOT NULL,
  End_Place     VARCHAR(19) NOT NULL,
  Start_Lat_in  NUMERIC(9,6) NOT NULL,
  Start_Long_in NUMERIC(9,6) NOT NULL,
  End_Lat_in    NUMERIC(9,6) NOT NULL,
  End_Long_in   NUMERIC(9,6) NOT NULL,
  UID           INTEGER  NOT NULL,
);

SELECT AVG(Duration) as AVGDuration, MIN(Time) as startingTime
FROM [dbo].[distDurData]
where JID = 51
Group by DATEPART(YEAR, Time),
DATEPART(MONTH, Time),
DATEPART(DAY, Time),
DATEPART(HOUR, Time),
(DATEPART(MINUTE, Time) / 5)