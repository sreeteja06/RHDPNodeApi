use rhdpTest;
GO

create table distDurData
(
  JID int not null,
  Duration int not null,
  Distance int not null,
  Time VARCHAR(60) NOT NULL
);
GO